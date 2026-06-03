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
	 * The CPT registrar instance.
	 *
	 * Held on the singleton so Plans 03/04 can share it (the REST controller
	 * and webhook both target the `weave_page` post type).
	 *
	 * @var Weave_CPT|null
	 */
	private ?Weave_CPT $cpt = null;

	/**
	 * The REST controller instance (weave/v1 routes).
	 *
	 * Held on the singleton for parity with the CPT and so future plans can
	 * reference the same instance.
	 *
	 * @var Weave_REST_Controller|null
	 */
	private ?Weave_REST_Controller $controller = null;

	/**
	 * The outbound revalidation webhook instance.
	 *
	 * Held on the singleton so the `save_post_weave_page` and `admin_init`
	 * callbacks share one instance (Plan 04).
	 *
	 * @var Weave_Webhook|null
	 */
	private ?Weave_Webhook $webhook = null;

	/**
	 * The WP Admin editor screen + asset enqueue (Plan 08, WEAVE-WP-07).
	 *
	 * Held on the singleton for parity with the other wiring blocks.
	 *
	 * @var Weave_Admin|null
	 */
	private ?Weave_Admin $admin = null;

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
	 * Single insertion point for later plans. Each plan adds exactly one wiring
	 * block; classes must exist before being referenced (autoloaded via the
	 * Composer classmap over src/).
	 *
	 * @return void
	 */
	private function register_hooks(): void {
		// Plan 02: register the weave_page CPT on init.
		$this->cpt = new Weave_CPT();
		add_action( 'init', array( $this->cpt, 'register' ) );

		// Plan 03: register the weave/v1 REST routes on rest_api_init.
		$this->controller = new Weave_REST_Controller();
		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );

		// Plan 04: fire the HMAC-signed revalidation webhook on save_post_weave_page,
		// and register the revalidate-URL settings option on admin_init (D-13).
		$this->webhook = new Weave_Webhook();
		add_action( 'save_post_weave_page', array( $this->webhook, 'on_save' ), 10, 3 );
		add_action( 'admin_init', array( $this->webhook, 'register_settings' ) );

		// Plan 08: register the WP Admin editor screen + enqueue the built bundle (WEAVE-WP-07).
		$this->admin = new Weave_Admin();
		$this->admin->register_hooks();
	}
}
