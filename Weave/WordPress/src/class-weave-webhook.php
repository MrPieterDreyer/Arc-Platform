<?php
/**
 * Weave outbound revalidation webhook.
 *
 * On every save of a `weave_page` post, fires a single HMAC-SHA256-signed,
 * non-blocking POST to the configured Next.js revalidate URL so the frontend
 * can purge its data cache for the affected page (ADR-0007 transport, ADR-0004
 * tag taxonomy).
 *
 * Byte-parity is load-bearing: the body is JSON-encoded ONCE with
 * `JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE`, that exact string is signed,
 * and that exact string is POSTed. The Next.js verifier re-hashes the raw body
 * byte-for-byte — any re-encode would drift the signature and yield a 401.
 *
 * @package Weave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Signs and delivers the page.updated revalidation webhook.
 *
 * @since 0.1.0
 */
final class Weave_Webhook {

	/**
	 * Settings group + option name for the Next.js revalidate URL (D-13).
	 *
	 * The shared secret is NEVER stored as an option — it is the
	 * `WEAVE_WEBHOOK_SECRET` constant from `wp-config.php` only.
	 *
	 * @var string
	 */
	public const OPTION = 'weave_revalidate_url';

	/**
	 * Settings group key used by `register_setting`.
	 *
	 * @var string
	 */
	public const SETTINGS_GROUP = 'weave';

	/**
	 * Handle a `save_post_weave_page` save: sign and POST the revalidation event.
	 *
	 * Guarded against autosave, revisions, and auto-draft so the webhook fires at
	 * most once per real save (Pitfall 2). Degrades gracefully (logged, non-fatal)
	 * when the secret constant is undefined or the URL option is empty (D-13).
	 *
	 * @param int     $post_id The post ID being saved.
	 * @param WP_Post $post    The post object being saved.
	 * @param bool    $update  Whether this is an update to an existing post.
	 * @return void
	 */
	public function on_save( int $post_id, WP_Post $post, bool $update ): void {
		if ( ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE )
			|| wp_is_post_revision( $post_id )
			|| 'auto-draft' === $post->post_status ) {
			return;                                     // Pitfall 2 guards.
		}
		if ( ! defined( 'WEAVE_WEBHOOK_SECRET' ) ) {
			error_log( 'Weave: webhook secret undefined; skipping' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- D-13 non-fatal skip.
			return;                                     // D-13.
		}
		$url = get_option( self::OPTION, '' );
		if ( '' === $url ) {
			error_log( 'Weave: revalidate URL unset; skipping' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- D-13 non-fatal skip.
			return;                                     // D-13.
		}

		$payload = array(
			'event'     => 'page.updated',
			'tag'       => 'weave:page:' . $post->post_name, // ADR-0004 taxonomy.
			'timestamp' => gmdate( 'c' ),
		);

		// Encode ONCE; sign and POST THIS exact string (Pitfall 5 — byte-parity).
		$body = wp_json_encode( $payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		$sig  = 'sha256=' . hash_hmac( 'sha256', $body, WEAVE_WEBHOOK_SECRET );

		wp_remote_post(
			$url,
			array(
				'headers'  => array(
					'Content-Type'      => 'application/json',
					'X-Weave-Signature' => $sig,
					'X-Weave-Timestamp' => $payload['timestamp'],
				),
				'body'     => $body,        // Same string that was signed — never re-encode.
				'blocking' => false,        // Fire-and-forget so save latency is decoupled (D-12).
				'timeout'  => 1.0,          // Bound the connection (Pitfall 1).
			)
		);
	}

	/**
	 * Register the `weave_revalidate_url` settings option (D-13).
	 *
	 * Wired on `admin_init`. The URL is a stored WP option (sanitized as a URL);
	 * the secret is intentionally NOT an option. A full settings UI is out of
	 * scope for this phase — registering the option is sufficient.
	 *
	 * @return void
	 */
	public function register_settings(): void {
		register_setting(
			self::SETTINGS_GROUP,
			self::OPTION,
			array(
				'type'              => 'string',
				'sanitize_callback' => 'esc_url_raw',
				'default'           => '',
			)
		);
	}
}
