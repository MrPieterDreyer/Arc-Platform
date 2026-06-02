<?php
/**
 * Weave plugin bootstrap singleton.
 *
 * @package Weave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Singleton bootstrap for the Weave plugin.
 *
 * Owns the single deterministic hook-registration point for the plugin. The
 * constructor is side-effect-free beyond registering hooks; all real work happens
 * inside the hooked callbacks wired by later plans.
 *
 * @since 0.1.0
 */
final class Weave_Plugin {

	/**
	 * The single instance of this class.
	 *
	 * @var Weave_Plugin|null
	 */
	private static ?self $instance = null;

	/**
	 * Retrieve (and lazily create) the singleton instance.
	 *
	 * @return self
	 */
	public static function instance(): self {
		return self::$instance ??= new self();
	}

	/**
	 * Private constructor — wires hooks once. No work beyond hook registration.
	 */
	private function __construct() {
		$this->register_hooks();
	}

	/**
	 * Register all WordPress hooks for the plugin.
	 *
	 * Single insertion point for later plans. Currently empty — the collaborating
	 * classes do not exist yet, so referencing them here would be a fatal load
	 * error. Each plan adds exactly one wiring block:
	 *
	 *   - Plan 02: $cpt = new Weave_CPT(); add_action( 'init', [ $cpt, 'register' ] );
	 *   - Plan 03: $controller = new Weave_REST_Controller(); add_action( 'rest_api_init', [ $controller, 'register_routes' ] );
	 *   - Plan 04: $webhook = new Weave_Webhook(); add_action( 'save_post_weave_page', [ $webhook, 'on_save' ], 10, 3 );
	 *
	 * @return void
	 */
	private function register_hooks(): void {
		// wired in Plan 02/03/04.
	}
}
