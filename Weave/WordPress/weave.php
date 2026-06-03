<?php
/**
 * Plugin Name:       Weave
 * Description:       Weave page-config storage + REST API for headless WooCommerce (Arc Platform).
 * Version:           0.1.0
 * Requires PHP:      8.1
 * Requires at least: 6.4
 * WC requires at least: 9.0
 * License:           MIT
 * Text Domain:       weave
 *
 * @package Weave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Absolute path to this main plugin file — the base for plugins_url() asset URLs
// (e.g. the WP Admin editor bundle enqueued by Weave_Admin).
if ( ! defined( 'WEAVE_PLUGIN_FILE' ) ) {
	define( 'WEAVE_PLUGIN_FILE', __FILE__ );
}

// Composer classmap autoload when present; otherwise load src/ explicitly for wp-env
// mappings where `composer install` has not been run in the plugin directory.
$weave_autoload = __DIR__ . '/vendor/autoload.php';
if ( is_readable( $weave_autoload ) ) {
	require_once $weave_autoload;
} else {
	require_once __DIR__ . '/src/class-weave-cpt.php';
	require_once __DIR__ . '/src/class-weave-validator.php';
	require_once __DIR__ . '/src/class-weave-rest-controller.php';
	require_once __DIR__ . '/src/class-weave-webhook.php';
	require_once __DIR__ . '/src/class-weave-admin.php';
}

require_once __DIR__ . '/src/class-weave-plugin.php';

Weave_Plugin::instance();
