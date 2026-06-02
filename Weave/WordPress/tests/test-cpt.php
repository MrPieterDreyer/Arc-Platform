<?php
/**
 * Tests for the weave_page custom post type registration.
 *
 * The CPT is registered on the `init` action, which the WordPress test bootstrap
 * fires before the test methods run. These assertions therefore inspect the
 * already-registered post-type object via WordPress core lookups.
 *
 * @package Weave
 */

/**
 * @covers Weave_CPT
 */
class Test_Weave_CPT extends WP_UnitTestCase {

	/**
	 * The CPT must exist once `init` has fired (WEAVE-WP-01, ADR-0005).
	 */
	public function test_weave_page_post_type_registered(): void {
		$this->assertTrue( post_type_exists( 'weave_page' ) );
	}

	/**
	 * The CPT must be REST-enabled (ADR-0005 — Next.js reads it over REST).
	 */
	public function test_weave_page_is_rest_enabled(): void {
		$obj = get_post_type_object( 'weave_page' );
		$this->assertNotNull( $obj );
		$this->assertTrue( $obj->show_in_rest );
	}

	/**
	 * Gutenberg must never open these posts — `editor` support is omitted
	 * (ADR-0002 / D-03). `title` support is present.
	 */
	public function test_weave_page_has_no_editor_support_but_has_title(): void {
		$this->assertFalse( post_type_supports( 'weave_page', 'editor' ) );
		$this->assertTrue( post_type_supports( 'weave_page', 'title' ) );
	}

	/**
	 * Custom-fields support is present (ADR-0005 CPT flags).
	 */
	public function test_weave_page_supports_custom_fields(): void {
		$this->assertTrue( post_type_supports( 'weave_page', 'custom-fields' ) );
	}

	/**
	 * Storage-only CPT: not public, but visible in wp-admin for debugging.
	 */
	public function test_weave_page_is_private_but_show_ui(): void {
		$obj = get_post_type_object( 'weave_page' );
		$this->assertNotNull( $obj );
		$this->assertFalse( $obj->public );
		$this->assertTrue( $obj->show_ui );
	}

	/**
	 * The server-side section-id helper (D-08) returns an RFC-4122 v4 UUID.
	 * Consumed by Plan 03's POST /sections.
	 */
	public function test_generate_section_id_returns_uuid_v4(): void {
		$id = Weave_CPT::generate_section_id();
		$this->assertIsString( $id );
		$this->assertMatchesRegularExpression(
			'/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
			$id
		);
	}
}
