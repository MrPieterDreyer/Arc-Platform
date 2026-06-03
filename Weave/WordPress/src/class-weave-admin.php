<?php
/**
 * Weave Admin screen + editor-bundle enqueue (WEAVE-WP-07).
 *
 * Registers a single top-level "Weave" admin menu page that prints the
 * `#weave-editor-root` mount container, and enqueues the wp-scripts-built React
 * editor bundle ONLY on that screen. The bundle's script dependencies + cache-bust
 * version come from the generated `admin/build/index.asset.php` manifest — so React
 * is loaded from WP's own `wp-element` (no second React bundled, OQ1).
 *
 * @package Weave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The WP Admin editor screen + asset enqueue.
 *
 * @since 0.1.0
 */
class Weave_Admin {

	/**
	 * Menu slug for the top-level Weave admin page.
	 *
	 * @var string
	 */
	private const MENU_SLUG = 'weave-editor';

	/**
	 * The `page_hook` returned by add_menu_page(), captured so the enqueue only
	 * fires on the Weave screen.
	 *
	 * @var string
	 */
	private string $page_hook = '';

	/**
	 * Register the admin hooks. Called once from Weave_Plugin::register_hooks().
	 *
	 * @return void
	 */
	public function register_hooks(): void {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Register the top-level "Weave" menu page.
	 *
	 * @return void
	 */
	public function register_menu(): void {
		$this->page_hook = (string) add_menu_page(
			__( 'Weave', 'weave' ),
			__( 'Weave', 'weave' ),
			'edit_posts',
			self::MENU_SLUG,
			array( $this, 'render_screen' ),
			'dashicons-layout'
		);
	}

	/**
	 * Render the editor screen — just the React mount container.
	 *
	 * @return void
	 */
	public function render_screen(): void {
		echo '<div class="wrap"><div id="weave-editor-root"></div></div>';
	}

	/**
	 * Enqueue the built editor bundle on the Weave screen only.
	 *
	 * Reads the wp-scripts-generated asset manifest for the externalized script
	 * dependencies (incl. `wp-element` = WP's React) and the content-hash version,
	 * so no second React copy is bundled (OQ1).
	 *
	 * @param string $hook_suffix Current admin page hook.
	 * @return void
	 */
	public function enqueue_assets( string $hook_suffix ): void {
		if ( $hook_suffix !== $this->page_hook ) {
			return;
		}

		$asset_path = __DIR__ . '/../admin/build/index.asset.php';
		if ( ! is_readable( $asset_path ) ) {
			return;
		}

		$asset = require $asset_path;

		wp_enqueue_script(
			'weave-admin',
			plugins_url( 'admin/build/index.js', WEAVE_PLUGIN_FILE ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style( 'wp-components' );
	}
}
