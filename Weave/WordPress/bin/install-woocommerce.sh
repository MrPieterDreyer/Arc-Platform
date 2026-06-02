#!/usr/bin/env bash
#
# install-woocommerce.sh — download a WooCommerce plugin build into the WP test
# plugins directory so PHPUnit cells that touch WC APIs can load it.
#
# Satisfies the WC dimension of the WEAVE-WP-09 CI matrix (Plan 06, D-15):
# PHP 8.1-8.4 x WP latest+6.9 x WC latest+10.7.1. The WC version arg lets each
# matrix cell select `latest` or a pinned previous minor (e.g. 10.7.1).
#
# WooCommerce is only required when a test references WC APIs; the download is
# best-effort (a missing/failed download does NOT fail the cell) but the WC
# matrix dimension itself MUST exist per D-15.
#
# Make executable: chmod +x bin/install-woocommerce.sh
#
# Usage:
#   bin/install-woocommerce.sh [wc-version]
#
# Examples (CI matrix cell):
#   bin/install-woocommerce.sh latest
#   bin/install-woocommerce.sh 10.7.1

set -uo pipefail

WC_VERSION=${1-latest}

TMPDIR=${TMPDIR-/tmp}
TMPDIR=$(echo "$TMPDIR" | sed -e "s/\/$//")
WP_CORE_DIR=${WP_CORE_DIR-$TMPDIR/wordpress}
PLUGINS_DIR="$WP_CORE_DIR/wp-content/plugins"

# WordPress.org plugin SVN serves `latest-stable` and per-version zips.
if [ "$WC_VERSION" = "latest" ]; then
	WC_URL="https://downloads.wordpress.org/plugin/woocommerce.latest-stable.zip"
else
	WC_URL="https://downloads.wordpress.org/plugin/woocommerce.${WC_VERSION}.zip"
fi

download() {
	if command -v curl >/dev/null 2>&1; then
		curl -sL "$1" >"$2"
	elif command -v wget >/dev/null 2>&1; then
		wget -nv -O "$2" "$1"
	else
		echo "install-woocommerce: neither curl nor wget available; skipping WC ${WC_VERSION}" >&2
		return 1
	fi
}

echo "install-woocommerce: fetching woocommerce ${WC_VERSION} from ${WC_URL}"

mkdir -p "$PLUGINS_DIR"

WC_ZIP="$TMPDIR/woocommerce.zip"
if ! download "$WC_URL" "$WC_ZIP"; then
	echo "install-woocommerce: download failed for WC ${WC_VERSION}; continuing without WooCommerce (best-effort)" >&2
	exit 0
fi

if ! unzip -q -o "$WC_ZIP" -d "$PLUGINS_DIR"; then
	echo "install-woocommerce: unzip failed for WC ${WC_VERSION}; continuing without WooCommerce (best-effort)" >&2
	exit 0
fi

echo "install-woocommerce: woocommerce ${WC_VERSION} installed into ${PLUGINS_DIR}/woocommerce"
exit 0
