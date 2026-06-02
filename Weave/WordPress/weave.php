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

// Composer classmap autoload. Guarded so the plugin still loads when run directly
// from the classmap under test (vendor/ may be absent in some bootstrap paths);
// the explicit require below guarantees Weave_Plugin is defined either way.
$weave_autoload = __DIR__ . '/vendor/autoload.php';
if ( is_readable( $weave_autoload ) ) {
	require_once $weave_autoload;
}

require_once __DIR__ . '/src/class-weave-plugin.php';

Weave_Plugin::instance();
