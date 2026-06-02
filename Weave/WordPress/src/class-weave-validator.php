<?php
/**
 * Structural validator for Weave page configs (D-07).
 *
 * Mirrors the Phase-3 Zod `WeavePageConfigSchema`
 * (Weave/React/src/schemas/page-config.ts) field-for-field, so this PHP
 * validator accepts exactly what the Next.js consumer's `.parse()` accepts.
 * It is additionally STRICTER than Zod in one respect: unknown top-level (and
 * unknown section) keys are rejected (D-07), whereas a plain `z.object()`
 * silently strips them.
 *
 * Per-type prop validation of `sections[].data` is intentionally NOT done here
 * — that is the `@weave/react` section schema's job (D-07). This validator only
 * checks the structural shape (object vs list).
 *
 * @package Weave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Validates a decoded page config against the ADR-0005 / Zod field contracts.
 *
 * @since 0.1.0
 */
final class Weave_Validator {

	/**
	 * Allowed top-level keys (D-07 — anything else is rejected).
	 *
	 * @var string[]
	 */
	private const ALLOWED_ROOT_KEYS = array( 'schemaVersion', 'slug', 'sections', 'updatedAt' );

	/**
	 * Allowed keys on each section object (D-07).
	 *
	 * @var string[]
	 */
	private const ALLOWED_SECTION_KEYS = array( 'id', 'type', 'data', 'version' );

	/**
	 * Validate a decoded page config.
	 *
	 * Expects the associative-array result of `json_decode( $raw, true )`.
	 * Returns a list of field-level error entries; an empty array means valid.
	 * Plan 03 wraps these into the 422 body `{ code, message, data: { fields } }`.
	 *
	 * @param mixed $data Decoded page config (expected: associative array).
	 * @return array<int,array{field:string,message:string}> Field-level errors; empty when valid.
	 */
	public static function validate_page_config( $data ): array {
		$errors = array();

		// Root must be a JSON object (assoc array), not a scalar or a list.
		if ( ! is_array( $data ) || ( array() !== $data && array_is_list( $data ) ) ) {
			return array(
				array(
					'field'   => '',
					'message' => 'Page config must be a JSON object',
				),
			);
		}

		// Required top-level keys.
		foreach ( self::ALLOWED_ROOT_KEYS as $key ) {
			if ( ! array_key_exists( $key, $data ) ) {
				$errors[] = self::error( $key, 'Required field is missing' );
			}
		}

		// D-07: reject unknown top-level keys (stricter than Zod).
		foreach ( array_keys( $data ) as $key ) {
			if ( ! in_array( $key, self::ALLOWED_ROOT_KEYS, true ) ) {
				$errors[] = self::error( (string) $key, 'Unknown top-level key' );
			}
		}

		// schemaVersion: integer (reject float/string).
		if ( array_key_exists( 'schemaVersion', $data ) && ! is_int( $data['schemaVersion'] ) ) {
			$errors[] = self::error( 'schemaVersion', 'Must be an integer' );
		}

		// slug: non-empty string.
		if ( array_key_exists( 'slug', $data ) && ( ! is_string( $data['slug'] ) || '' === $data['slug'] ) ) {
			$errors[] = self::error( 'slug', 'Must be a non-empty string' );
		}

		// updatedAt: any string (not over-constrained to ISO — Zod parity).
		if ( array_key_exists( 'updatedAt', $data ) && ! is_string( $data['updatedAt'] ) ) {
			$errors[] = self::error( 'updatedAt', 'Must be a string' );
		}

		// sections: a JSON array (list); each element validated as a section.
		if ( array_key_exists( 'sections', $data ) ) {
			$sections = $data['sections'];
			if ( ! is_array( $sections ) || ( array() !== $sections && ! array_is_list( $sections ) ) ) {
				$errors[] = self::error( 'sections', 'Must be a JSON array' );
			} else {
				foreach ( $sections as $i => $section ) {
					$errors = array_merge( $errors, self::validate_section( $section, (int) $i ) );
				}
			}
		}

		return $errors;
	}

	/**
	 * Validate one section object.
	 *
	 * @param mixed $section A single decoded section.
	 * @param int   $index   Index within the sections array (for field paths).
	 * @return array<int,array{field:string,message:string}> Field-level errors.
	 */
	private static function validate_section( $section, int $index ): array {
		$errors = array();
		$prefix = "sections[{$index}]";

		// Section must itself be a JSON object.
		if ( ! is_array( $section ) || ( array() !== $section && array_is_list( $section ) ) ) {
			return array( self::error( $prefix, 'Must be a JSON object' ) );
		}

		// Required section keys.
		foreach ( self::ALLOWED_SECTION_KEYS as $key ) {
			if ( ! array_key_exists( $key, $section ) ) {
				$errors[] = self::error( "{$prefix}.{$key}", 'Required field is missing' );
			}
		}

		// D-07: reject unknown section keys.
		foreach ( array_keys( $section ) as $key ) {
			if ( ! in_array( $key, self::ALLOWED_SECTION_KEYS, true ) ) {
				$errors[] = self::error( "{$prefix}." . (string) $key, 'Unknown section key' );
			}
		}

		// id: non-empty string (NOT UUID-strict — Zod min(1) parity).
		if ( array_key_exists( 'id', $section ) && ( ! is_string( $section['id'] ) || '' === $section['id'] ) ) {
			$errors[] = self::error( "{$prefix}.id", 'Must be a non-empty string' );
		}

		// type: non-empty string.
		if ( array_key_exists( 'type', $section ) && ( ! is_string( $section['type'] ) || '' === $section['type'] ) ) {
			$errors[] = self::error( "{$prefix}.type", 'Must be a non-empty string' );
		}

		// version: integer.
		if ( array_key_exists( 'version', $section ) && ! is_int( $section['version'] ) ) {
			$errors[] = self::error( "{$prefix}.version", 'Must be an integer' );
		}

		// data: a JSON object/record (not a list). Empty {} accepted.
		if ( array_key_exists( 'data', $section ) ) {
			$value = $section['data'];
			if ( ! is_array( $value ) || ( array() !== $value && array_is_list( $value ) ) ) {
				$errors[] = self::error( "{$prefix}.data", 'Must be a JSON object' );
			}
		}

		return $errors;
	}

	/**
	 * Build a field-level error entry.
	 *
	 * @param string $field   Dotted/bracketed field path.
	 * @param string $message Human-readable message.
	 * @return array{field:string,message:string}
	 */
	private static function error( string $field, string $message ): array {
		return array(
			'field'   => $field,
			'message' => $message,
		);
	}
}
