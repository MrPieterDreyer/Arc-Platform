<?php
/**
 * Tests for the Weave outbound revalidation webhook (WEAVE-WP-06, ADR-0007).
 *
 * No real network is used: the WP HTTP API is short-circuited via the
 * `pre_http_request` filter, which captures the outbound `wp_remote_post`
 * arguments. The signature assertion independently recomputes the HMAC over the
 * EXACT captured body — proving byte-parity with the Next.js verifier (Pitfall 5).
 *
 * @package Weave
 */

/**
 * @covers Weave_Webhook
 */
class Test_Weave_Webhook extends WP_UnitTestCase {

	/**
	 * The most recent captured `wp_remote_post` call, or null if none fired.
	 *
	 * Shape: [ 'args' => array, 'url' => string ].
	 *
	 * @var array|null
	 */
	private ?array $captured = null;

	/**
	 * Install the HTTP short-circuit + a configured revalidate URL before each test.
	 */
	public function set_up(): void {
		parent::set_up();
		$this->captured = null;
		add_filter( 'pre_http_request', array( $this, 'capture_http' ), 10, 3 );
		update_option( Weave_Webhook::OPTION, 'https://next.example/api/revalidate' );
	}

	/**
	 * Remove the filter + option after each test to avoid cross-test bleed.
	 */
	public function tear_down(): void {
		remove_filter( 'pre_http_request', array( $this, 'capture_http' ), 10 );
		delete_option( Weave_Webhook::OPTION );
		$this->captured = null;
		parent::tear_down();
	}

	/**
	 * Short-circuit the WP HTTP API, recording the outbound request.
	 *
	 * @param mixed  $pre  Filtered short-circuit response (we replace it).
	 * @param array  $args The wp_remote_post arguments.
	 * @param string $url  The target URL.
	 * @return array A fake successful response so no real request is made.
	 */
	public function capture_http( $pre, $args, $url ) {
		$this->captured = array(
			'args' => $args,
			'url'  => $url,
		);
		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Create and publish a weave_page, firing the save_post_weave_page hook.
	 *
	 * @param string $post_name The desired post slug.
	 * @param string $status    The post status to create with.
	 * @return int The created post ID.
	 */
	private function create_weave_page( string $post_name = 'home', string $status = 'publish' ): int {
		return self::factory()->post->create(
			array(
				'post_type'   => 'weave_page',
				'post_name'   => $post_name,
				'post_status' => $status,
				'post_title'  => 'Home',
			)
		);
	}

	/**
	 * The signature must equal an independently recomputed HMAC over the EXACT
	 * captured body — proving the signed bytes are the POSTed bytes (Pitfall 5).
	 */
	public function test_webhook_signs_and_posts(): void {
		$this->create_weave_page();

		$this->assertNotNull( $this->captured, 'Expected a webhook POST to fire' );
		$this->assertSame( 'https://next.example/api/revalidate', $this->captured['url'] );

		$expected = 'sha256=' . hash_hmac( 'sha256', $this->captured['args']['body'], WEAVE_WEBHOOK_SECRET );
		$this->assertSame( $expected, $this->captured['args']['headers']['X-Weave-Signature'] );
		$this->assertSame( 'application/json', $this->captured['args']['headers']['Content-Type'] );
	}

	/**
	 * The body decodes to event/tag/timestamp; tag uses the ADR-0004 taxonomy and
	 * the timestamp equals the X-Weave-Timestamp header.
	 */
	public function test_webhook_body_shape(): void {
		$this->create_weave_page( 'home' );

		$this->assertNotNull( $this->captured );
		$decoded = json_decode( $this->captured['args']['body'], true );

		$this->assertSame( 'page.updated', $decoded['event'] );
		$this->assertSame( 'weave:page:home', $decoded['tag'] );
		$this->assertSame(
			$this->captured['args']['headers']['X-Weave-Timestamp'],
			$decoded['timestamp'],
			'Body timestamp must equal the X-Weave-Timestamp header'
		);
	}

	/**
	 * Delivery is non-blocking with a short timeout (D-12, Pitfall 1).
	 */
	public function test_webhook_non_blocking(): void {
		$this->create_weave_page();

		$this->assertNotNull( $this->captured );
		$this->assertFalse( $this->captured['args']['blocking'] );
		$this->assertLessThanOrEqual( 1.0, $this->captured['args']['timeout'] );
	}

	/**
	 * An autosave (DOING_AUTOSAVE) must not fire the webhook (Pitfall 2).
	 */
	public function test_webhook_skips_on_autosave(): void {
		if ( ! defined( 'DOING_AUTOSAVE' ) ) {
			define( 'DOING_AUTOSAVE', true );
		}
		$this->create_weave_page();
		$this->assertNull( $this->captured, 'Autosave must not fire the webhook' );
	}

	/**
	 * A revision must not fire the webhook (Pitfall 2).
	 *
	 * Publishing a post and then updating it creates a revision; calling the
	 * handler directly with the revision ID must short-circuit on
	 * wp_is_post_revision().
	 */
	public function test_webhook_skips_on_revision(): void {
		$post_id = $this->create_weave_page( 'home' );
		$this->captured = null;

		wp_update_post(
			array(
				'ID'         => $post_id,
				'post_title' => 'Home Updated',
			)
		);
		$revisions = wp_get_post_revisions( $post_id );
		$this->assertNotEmpty( $revisions, 'Expected at least one revision' );

		$revision = array_values( $revisions )[0];
		$this->captured = null;

		$webhook = new Weave_Webhook();
		$webhook->on_save( $revision->ID, $revision, true );

		$this->assertNull( $this->captured, 'A revision must not fire the webhook' );
	}

	/**
	 * An auto-draft status post must not fire the webhook (Pitfall 2).
	 */
	public function test_webhook_skips_on_auto_draft(): void {
		$this->create_weave_page( 'draft-page', 'auto-draft' );
		$this->assertNull( $this->captured, 'auto-draft must not fire the webhook' );
	}

	/**
	 * With the revalidate URL unset, the webhook is skipped, not fatal (D-13).
	 */
	public function test_webhook_skips_when_url_unset(): void {
		delete_option( Weave_Webhook::OPTION );
		$this->create_weave_page();
		$this->assertNull( $this->captured, 'Empty revalidate URL must skip the webhook' );
	}
}
