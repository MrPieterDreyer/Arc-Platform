<?php
/**
 * Weave page custom post type.
 *
 * Registers the `weave_page` CPT whose `post_content` holds a versioned JSON
 * page config (ADR-0005). The CPT is REST-enabled and deliberately omits
 * Gutenberg `editor` support (ADR-0002 / D-03) — the storage format is plain
 * JSON, never block markup.
 *
 * @package Weave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers and describes the `weave_page` storage post type.
 *
 * @since 0.1.0
 */
final class Weave_CPT {

	/**
	 * Post-type key for Weave page configs.
	 *
	 * @var string
	 */
	public const POST_TYPE = 'weave_page';

	/**
	 * Register the `weave_page` custom post type.
	 *
	 * Hooked to `init` by Weave_Plugin. Uses the exact flags mandated by
	 * ADR-0005 §Implementation Notes (REST-enabled, title + custom-fields
	 * support, no editor) and D-10 (post capability mapping).
	 *
	 * @return void
	 */
	public function register(): void {
		register_post_type(
			self::POST_TYPE,
			array(
				'label'           => 'Weave Pages',
				'public'          => false,        // Storage-only; not a public front-end CPT.
				'show_ui'         => true,         // Visible in wp-admin for debugging.
				'show_in_rest'    => true,         // REST-enabled (ADR-0005).
				'rest_base'       => 'weave_pages', // weave/v1 controller is authoritative regardless.
				'supports'        => array( 'title', 'custom-fields', 'revisions' ), // Gutenberg editor deliberately omitted (ADR-0002 / D-03); revisions enabled so the save_post webhook can skip revision saves (WEAVE-WP-06).
				'capability_type' => 'post',       // Maps to edit_posts etc. (D-10).
				'map_meta_cap'    => true,
			)
		);
	}

	/**
	 * Generate a server-side RFC-4122 v4 UUID for a new section (D-08).
	 *
	 * Reused by Plan 03's `POST /sections` so section ids are minted on the
	 * server and never reused after deletion.
	 *
	 * @return string An RFC-4122 version-4 UUID.
	 */
	public static function generate_section_id(): string {
		return wp_generate_uuid4();
	}
}
