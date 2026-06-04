<?php
/**
 * Parity + invalid-fixture tests for Weave_Validator::validate_page_config().
 *
 * The validator must accept exactly what the Phase-3 Zod WeavePageConfigSchema
 * accepts (Weave/React/src/schemas/page-config.ts), including unknown-key
 * rejection (D-07 — Zod `.strict()` parity).
 *
 * Inputs mirror `json_decode( $raw, true )` output: JSON objects become assoc
 * arrays, JSON arrays become list arrays. The canonical valid fixture is the
 * ADR-0005 example config so PHP/Zod parity is demonstrable.
 *
 * @package Weave
 */

/**
 * @covers Weave_Validator
 */
class Test_Weave_Validator extends WP_UnitTestCase {

	/**
	 * The ADR-0005 example config — the canonical valid fixture.
	 *
	 * @return array<string,mixed>
	 */
	private function adr_example(): array {
		return array(
			'schemaVersion' => 1,
			'slug'          => 'home',
			'sections'      => array(
				array(
					'id'      => '550e8400-e29b-41d4-a716-446655440000',
					'type'    => 'hero',
					'data'    => array(
						'heading'    => 'Welcome to LOFT Pro Shop',
						'subheading' => 'Premium golf equipment',
						'ctaLabel'   => 'Shop Now',
						'ctaHref'    => '/shop',
					),
					'version' => 1,
				),
				array(
					'id'      => '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
					'type'    => 'featured-products',
					'data'    => array(
						'collectionSlug' => 'featured',
						'limit'          => 4,
					),
					'version' => 1,
				),
			),
			'updatedAt'     => '2026-05-28T14:00:00Z',
		);
	}

	/** Helper: assert there is at least one error for the given field. */
	private function assertHasFieldError( array $errors, string $field ): void {
		$fields = array_column( $errors, 'field' );
		$this->assertContains( $field, $fields, "Expected an error for field '{$field}'. Got: " . wp_json_encode( $errors ) );
	}

	// --- Valid fixtures -----------------------------------------------------

	public function test_adr_example_is_valid(): void {
		$this->assertSame( array(), Weave_Validator::validate_page_config( $this->adr_example() ) );
	}

	public function test_empty_sections_array_is_valid(): void {
		$cfg             = $this->adr_example();
		$cfg['sections'] = array();
		$this->assertSame( array(), Weave_Validator::validate_page_config( $cfg ) );
	}

	public function test_section_with_empty_data_object_is_valid(): void {
		$cfg                          = $this->adr_example();
		$cfg['sections'][0]['data']   = array(); // {} after decode.
		$this->assertSame( array(), Weave_Validator::validate_page_config( $cfg ) );
	}

	public function test_non_uuid_non_empty_id_is_accepted(): void {
		// Parity: Zod only requires min(1); any non-empty string is valid.
		$cfg                       = $this->adr_example();
		$cfg['sections'][0]['id']  = 'not-a-uuid';
		$this->assertSame( array(), Weave_Validator::validate_page_config( $cfg ) );
	}

	// --- Invalid: top-level shape ------------------------------------------

	public function test_non_array_is_rejected(): void {
		$errors = Weave_Validator::validate_page_config( 'a string' );
		$this->assertNotEmpty( $errors );
	}

	public function test_non_empty_list_at_root_is_rejected(): void {
		$errors = Weave_Validator::validate_page_config( array( 'a', 'b' ) );
		$this->assertNotEmpty( $errors );
	}

	public function test_missing_schema_version_is_rejected(): void {
		$cfg = $this->adr_example();
		unset( $cfg['schemaVersion'] );
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'schemaVersion' );
	}

	public function test_schema_version_as_float_is_rejected(): void {
		$cfg                  = $this->adr_example();
		$cfg['schemaVersion'] = 1.5;
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'schemaVersion' );
	}

	public function test_schema_version_as_string_is_rejected(): void {
		$cfg                  = $this->adr_example();
		$cfg['schemaVersion'] = '1';
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'schemaVersion' );
	}

	public function test_empty_slug_is_rejected(): void {
		$cfg         = $this->adr_example();
		$cfg['slug'] = '';
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'slug' );
	}

	public function test_updated_at_non_string_is_rejected(): void {
		$cfg              = $this->adr_example();
		$cfg['updatedAt'] = 12345;
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'updatedAt' );
	}

	public function test_unknown_top_level_key_is_rejected(): void {
		// D-07 — STRICTER than Zod (which would strip it).
		$cfg          = $this->adr_example();
		$cfg['extra'] = 'nope';
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'extra' );
	}

	// --- Invalid: section shape --------------------------------------------

	public function test_section_version_as_string_is_rejected(): void {
		$cfg                            = $this->adr_example();
		$cfg['sections'][0]['version']  = '1';
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'sections[0].version' );
	}

	public function test_section_data_as_non_empty_list_is_rejected(): void {
		// A JSON list ["a"] is not a record/object.
		$cfg                         = $this->adr_example();
		$cfg['sections'][0]['data']  = array( 'a' );
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'sections[0].data' );
	}

	public function test_section_with_empty_id_is_rejected(): void {
		$cfg                       = $this->adr_example();
		$cfg['sections'][0]['id']  = '';
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'sections[0].id' );
	}

	public function test_sections_as_object_is_rejected(): void {
		// sections must be a JSON array (list), not an object.
		$cfg             = $this->adr_example();
		$cfg['sections'] = array( 'foo' => 'bar' );
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'sections' );
	}

	public function test_unknown_section_key_is_rejected(): void {
		// D-07 parity for section objects.
		$cfg                           = $this->adr_example();
		$cfg['sections'][0]['surprise'] = true;
		$this->assertHasFieldError( Weave_Validator::validate_page_config( $cfg ), 'sections[0].surprise' );
	}
}
