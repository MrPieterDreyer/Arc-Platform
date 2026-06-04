<?php
/**
 * Tests for the Weave Admin screen + editor-bundle enqueue (WEAVE-WP-07).
 *
 * Weave_Admin registers a top-level "Weave" admin page (mount container for the React editor) and
 * enqueues the wp-scripts-built bundle ONLY on that screen, reading its script dependencies from the
 * generated asset manifest so React comes from WP's `wp-element` (no second React — OQ1).
 *
 * These assertions exercise the PHP surface that cannot be reached by the JS/Vitest suite:
 * hook registration, the mount-container markup, the menu page, and the screen-scoped enqueue guard.
 *
 * NOTE: PHP/Composer are not installed on the dev host — this suite runs only in the wp-plugin CI
 * matrix (WEAVE-WP-09).
 *
 * @package Weave
 */

/**
 * @covers Weave_Admin
 */
class Test_Weave_Admin extends WP_UnitTestCase {

	/**
	 * register_hooks() wires both the menu and the asset enqueue (WEAVE-WP-07).
	 */
	public function test_register_hooks_adds_menu_and_enqueue_actions(): void {
		$admin = new Weave_Admin();
		$admin->register_hooks();

		$this->assertNotFalse(
			has_action( 'admin_menu', array( $admin, 'register_menu' ) ),
			'register_menu must be hooked to admin_menu'
		);
		$this->assertNotFalse(
			has_action( 'admin_enqueue_scripts', array( $admin, 'enqueue_assets' ) ),
			'enqueue_assets must be hooked to admin_enqueue_scripts'
		);
	}

	/**
	 * The screen renders the React mount container the JS bootstrap looks up (#weave-editor-root).
	 */
	public function test_render_screen_outputs_mount_container(): void {
		$admin = new Weave_Admin();

		ob_start();
		$admin->render_screen();
		$html = (string) ob_get_clean();

		$this->assertStringContainsString( 'id="weave-editor-root"', $html );
	}

	/**
	 * register_menu() registers a single top-level "weave-editor" admin page (WEAVE-WP-07).
	 */
	public function test_register_menu_registers_top_level_weave_page(): void {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		global $menu;
		$menu = array();

		$admin = new Weave_Admin();
		$admin->register_menu();

		$slugs = array_map(
			static function ( $item ) {
				return isset( $item[2] ) ? $item[2] : '';
			},
			$menu
		);

		$this->assertContains( 'weave-editor', $slugs );
	}

	/**
	 * The bundle is screen-scoped: enqueue_assets is a no-op on any screen other than the Weave
	 * page, so the editor script never loads elsewhere in wp-admin.
	 */
	public function test_enqueue_assets_is_noop_on_other_screens(): void {
		$admin = new Weave_Admin();
		// page_hook is '' until register_menu() runs, so any real hook suffix mismatches → early return.
		$admin->enqueue_assets( 'index.php' );

		$this->assertFalse(
			wp_script_is( 'weave-admin', 'enqueued' ),
			'editor bundle must not enqueue outside the Weave screen'
		);
	}
}
