<?php
/**
 * PHPUnit bootstrap for the Weave WordPress plugin test suite.
 *
 * Loads the WordPress core test framework, registers the plugin so it is active
 * inside the test WP install, and defines a deterministic WEAVE_WEBHOOK_SECRET
 * shim so the (Plan 04) webhook tests have a stable signing key without requiring
 * a real wp-config.php constant.
 *
 * @package Weave
 */

// Polyfills must be discoverable before the WP test bootstrap runs. The WP test
// suite reads WP_TESTS_PHPUNIT_POLYFILLS_PATH to locate yoast/phpunit-polyfills.
$_weave_polyfills = dirname( __DIR__ ) . '/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';
if ( is_readable( $_weave_polyfills ) ) {
	require_once $_weave_polyfills;
	if ( ! getenv( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' ) ) {
		putenv( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH=' . dirname( __DIR__ ) . '/vendor/yoast/phpunit-polyfills' );
	}
}

// Resolve the WordPress test-suite directory (installed by bin/install-wp-tests.sh).
$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wordpress-tests-lib';
}

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find {$_tests_dir}/includes/functions.php — run bin/install-wp-tests.sh first." . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Test-time webhook secret shim (>=32 bytes). Real installs set this in wp-config.php
// (generate with `openssl rand -hex 32`, ADR-0007 / D-13). Defined here so the suite
// is self-contained and the Plan 04 webhook signature tests are deterministic.
if ( ! defined( 'WEAVE_WEBHOOK_SECRET' ) ) {
	define( 'WEAVE_WEBHOOK_SECRET', 'test-secret-0123456789abcdef0123456789abcdef' );
}

// Give access to the WP test functions (tests_add_filter etc.).
require_once $_tests_dir . '/includes/functions.php';

/**
 * Load the Weave plugin inside the test WordPress instance.
 */
function _weave_manually_load_plugin() {
	require dirname( __DIR__ ) . '/weave.php';
}
tests_add_filter( 'muplugins_loaded', '_weave_manually_load_plugin' );

// Start the WP test environment (must be required last).
require $_tests_dir . '/includes/bootstrap.php';
