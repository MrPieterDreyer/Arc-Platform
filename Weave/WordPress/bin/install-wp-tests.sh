#!/usr/bin/env bash
#
# install-wp-tests.sh — provision the WordPress PHPUnit test suite + test database.
#
# Vendored from the canonical WP-CLI `wp scaffold plugin-tests` script. Downloads the
# WordPress core test framework for a given version and creates the test DB so
# `composer test` (vendor/bin/phpunit) can boot WP_UnitTestCase. Used by the
# WEAVE-WP-09 CI matrix (Plan 06) — the WP_VERSION arg lets each matrix cell select
# `latest` or a pinned previous major (e.g. 6.9).
#
# Make executable: chmod +x bin/install-wp-tests.sh
#
# Usage:
#   bin/install-wp-tests.sh <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-database-creation]
#
# Example (CI matrix cell):
#   bin/install-wp-tests.sh wordpress_test root root 127.0.0.1 latest
#   bin/install-wp-tests.sh wordpress_test root root 127.0.0.1 6.9

set -euo pipefail

if [ $# -lt 3 ]; then
	echo "usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version] [skip-database-creation]"
	exit 1
fi

DB_NAME=$1
DB_USER=$2
DB_PASS=$3
DB_HOST=${4-localhost}
WP_VERSION=${5-latest}
SKIP_DB_CREATE=${6-false}

TMPDIR=${TMPDIR-/tmp}
TMPDIR=$(echo "$TMPDIR" | sed -e "s/\/$//")
WP_TESTS_DIR=${WP_TESTS_DIR-$TMPDIR/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR-$TMPDIR/wordpress}

download() {
	# -f makes curl fail (non-zero) on HTTP errors so a 404 doesn't silently
	# write an error page into the target (which then breaks unzip).
	if [ "$(which curl)" ]; then
		curl -fsSL "$1" -o "$2"
	elif [ "$(which wget)" ]; then
		wget -nv -O "$2" "$1"
	else
		echo "Error: neither curl nor wget is available." >&2
		exit 1
	fi
}

# Resolve the requested WP version to a concrete tag and matching test-suite SVN tag.
if [[ $WP_VERSION =~ ^[0-9]+\.[0-9]+\-(beta|RC)[0-9]+$ ]]; then
	WP_BRANCH=${WP_VERSION%\-*}
	WP_TESTS_TAG="branches/$WP_BRANCH"
elif [[ $WP_VERSION =~ ^[0-9]+\.[0-9]+$ ]]; then
	WP_TESTS_TAG="branches/$WP_VERSION"
elif [[ $WP_VERSION =~ [0-9]+\.[0-9]+\.[0-9]+ ]]; then
	if [[ $WP_VERSION =~ [0-9]+\.[0-9]+\.[0] ]]; then
		# Version x.x.0 maps to the x.x SVN tag.
		WP_TESTS_TAG="tags/${WP_VERSION%??}"
	else
		WP_TESTS_TAG="tags/$WP_VERSION"
	fi
elif [[ $WP_VERSION == 'nightly' || $WP_VERSION == 'trunk' ]]; then
	WP_TESTS_TAG="trunk"
else
	# 'latest' — read the latest stable version from the WP API.
	download http://api.wordpress.org/core/version-check/1.7/ "$TMPDIR/wp-latest.json"
	LATEST_VERSION=$(grep -o '"version":"[^"]*' "$TMPDIR/wp-latest.json" | sed 's/"version":"//' | head -1)
	if [[ -z "$LATEST_VERSION" ]]; then
		echo "Latest WP version could not be found." >&2
		exit 1
	fi
	WP_TESTS_TAG="tags/$LATEST_VERSION"
fi

install_wp() {
	if [ -d "$WP_CORE_DIR/wp-includes" ]; then
		return
	fi

	mkdir -p "$WP_CORE_DIR"

	local ARCHIVE_NAME
	if [[ $WP_VERSION == 'nightly' || $WP_VERSION == 'trunk' ]]; then
		ARCHIVE_NAME='nightly'
		download https://wordpress.org/nightly-builds/wordpress-latest.zip "$TMPDIR/wordpress.zip"
	elif [ "$WP_VERSION" == 'latest' ]; then
		ARCHIVE_NAME='latest'
		download "https://wordpress.org/${ARCHIVE_NAME}.zip" "$TMPDIR/wordpress.zip"
	elif [[ $WP_VERSION =~ [0-9]+\.[0-9]+ ]]; then
		ARCHIVE_NAME="wordpress-$WP_VERSION"
		download "https://wordpress.org/${ARCHIVE_NAME}.zip" "$TMPDIR/wordpress.zip"
	else
		ARCHIVE_NAME="wordpress-$WP_VERSION"
		download "https://wordpress.org/${ARCHIVE_NAME}.zip" "$TMPDIR/wordpress.zip"
	fi

	# Stage outside WP_CORE_DIR — default $TMPDIR/wordpress matches the zip's
	# top-level folder name, so `mv dir/* dir` fails with "are the same file".
	local WP_EXTRACT_DIR="$TMPDIR/wp-archive-extract"
	rm -rf "$WP_EXTRACT_DIR"
	mkdir -p "$WP_EXTRACT_DIR"
	unzip -q "$TMPDIR/wordpress.zip" -d "$WP_EXTRACT_DIR"

	local WP_SRC="$WP_EXTRACT_DIR"
	if [ -d "$WP_EXTRACT_DIR/wordpress" ]; then
		WP_SRC="$WP_EXTRACT_DIR/wordpress"
	fi

	rm -rf "${WP_CORE_DIR:?}"/*
	mv "$WP_SRC"/* "$WP_CORE_DIR"/
	rm -rf "$WP_EXTRACT_DIR"

	download https://raw.githubusercontent.com/markoheijnen/wp-mysqli/master/db.php "$WP_CORE_DIR/wp-content/db.php"
}

install_test_suite() {
	# Portable sed -i across GNU/BSD.
	if [[ $(uname -s) == 'Darwin' ]]; then
		local ioption='-i.bak'
	else
		local ioption='-i'
	fi

	# Map the svn tag (branches/X, tags/X, trunk) to a GitHub ref on the
	# wordpress-develop mirror — ubuntu-24.04 runners no longer ship `svn`,
	# so we download a tarball instead of `svn export`.
	local GH_REF="${WP_TESTS_TAG#branches/}"
	GH_REF="${GH_REF#tags/}"

	if [ ! -d "$WP_TESTS_DIR/includes" ]; then
		mkdir -p "$WP_TESTS_DIR" "$TMPDIR/wp-develop"
		download "https://github.com/WordPress/wordpress-develop/archive/${GH_REF}.tar.gz" "$TMPDIR/wp-develop.tar.gz"
		tar --strip-components=1 -xzf "$TMPDIR/wp-develop.tar.gz" -C "$TMPDIR/wp-develop"
		cp -r "$TMPDIR/wp-develop/tests/phpunit/includes" "$WP_TESTS_DIR/includes"
		cp -r "$TMPDIR/wp-develop/tests/phpunit/data" "$WP_TESTS_DIR/data"
	fi

	if [ ! -f wp-tests-config.php ]; then
		download "https://raw.githubusercontent.com/WordPress/wordpress-develop/${GH_REF}/wp-tests-config-sample.php" "$WP_TESTS_DIR"/wp-tests-config.php
		WP_CORE_DIR=$(echo "$WP_CORE_DIR" | sed "s:/\+$::")
		sed $ioption "s:dirname( __FILE__ ) . '/src/':'$WP_CORE_DIR/':" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s/youremptytestdbnamehere/$DB_NAME/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s/yourusernamehere/$DB_USER/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s/yourpasswordhere/$DB_PASS/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed $ioption "s|localhost|${DB_HOST}|" "$WP_TESTS_DIR"/wp-tests-config.php
	fi
}

install_db() {
	if [ "${SKIP_DB_CREATE}" = "true" ]; then
		return 0
	fi

	# Parse DB_HOST for socket / port.
	local PARTS
	IFS=':' read -ra PARTS <<<"$DB_HOST"
	local DB_HOSTNAME=${PARTS[0]}
	local DB_SOCK_OR_PORT=${PARTS[1]-}
	local EXTRA=""

	if [ -n "$DB_HOSTNAME" ]; then
		if [[ "$DB_SOCK_OR_PORT" =~ ^[0-9]+$ ]]; then
			EXTRA=" --host=$DB_HOSTNAME --port=$DB_SOCK_OR_PORT --protocol=tcp"
		elif [ -n "$DB_SOCK_OR_PORT" ]; then
			EXTRA=" --socket=$DB_SOCK_OR_PORT"
		elif [ -n "$DB_HOSTNAME" ]; then
			EXTRA=" --host=$DB_HOSTNAME --protocol=tcp"
		fi
	fi

	# shellcheck disable=SC2086
	if ! mysqladmin create "$DB_NAME" --user="$DB_USER" --password="$DB_PASS"$EXTRA 2>/dev/null; then
		echo "Database $DB_NAME already exists — dropping and recreating"
		# --force skips the interactive "drop database?" confirmation, which would
		# otherwise abort under CI (no tty) and leave the DB in place.
		mysqladmin --force drop "$DB_NAME" --user="$DB_USER" --password="$DB_PASS"$EXTRA 2>/dev/null || true
		mysqladmin create "$DB_NAME" --user="$DB_USER" --password="$DB_PASS"$EXTRA
	fi
}

install_wp
install_test_suite
install_db
