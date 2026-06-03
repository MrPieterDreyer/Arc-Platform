<?php
/**
 * Integration tests for the weave/v1 REST controller (WEAVE-WP-02/03/04).
 *
 * Exercises the routes in-process via rest_get_server() + WP_REST_Request +
 * rest_do_request, with an authenticated administrator for the happy paths.
 * Covers pages (GET list metadata-only, GET/PUT item, 413, 422, 404,
 * server-set updatedAt) and sections (POST 201 with server-generated id,
 * client-id ignored, DELETE removal, 404s).
 *
 * @package Weave
 */

/**
 * @covers Weave_REST_Controller
 */
class Test_Weave_REST_CRUD extends WP_UnitTestCase {

	/**
	 * Administrator user id used for the authenticated happy-path cases.
	 *
	 * @var int
	 */
	private int $admin_id;

	/**
	 * Ensure the controller routes are registered and authenticate as an admin.
	 */
	public function set_up(): void {
		parent::set_up();

		// Make sure the weave/v1 routes exist for this request lifecycle.
		do_action( 'rest_api_init' );

		$this->admin_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->admin_id );
	}

	/**
	 * Build a minimal valid ADR-0005 page config for the given slug.
	 *
	 * @param string $slug Page slug.
	 * @return array<string,mixed>
	 */
	private function valid_config( string $slug ): array {
		return array(
			'schemaVersion' => 1,
			'slug'          => $slug,
			'sections'      => array(
				array(
					'id'      => '550e8400-e29b-41d4-a716-446655440000',
					'type'    => 'hero',
					'data'    => array( 'heading' => 'Welcome' ),
					'version' => 1,
				),
			),
			'updatedAt'     => '2000-01-01T00:00:00+00:00',
		);
	}

	/**
	 * PUT a config through the route and return the response.
	 *
	 * @param string              $slug Page slug.
	 * @param array<string,mixed> $body Config body.
	 * @return WP_REST_Response
	 */
	private function put_config( string $slug, array $body ): WP_REST_Response {
		$req = new WP_REST_Request( 'PUT', "/weave/v1/pages/{$slug}" );
		$req->set_header( 'Content-Type', 'application/json' );
		$req->set_body( wp_json_encode( $body ) );
		return rest_do_request( $req );
	}

	/* ----------------------------- pages: PUT ----------------------------- */

	/**
	 * PUT a valid config -> 200; server overwrites updatedAt + persists.
	 */
	public function test_pages_put_valid_returns_200_and_sets_updated_at(): void {
		$cfg            = $this->valid_config( 'home' );
		$cfg['updatedAt'] = 'CLIENT-SUPPLIED-VALUE';

		$resp = $this->put_config( 'home', $cfg );
		$this->assertSame( 200, $resp->get_status() );

		$data = $resp->get_data();
		$this->assertArrayHasKey( 'updatedAt', $data );
		$this->assertNotSame( 'CLIENT-SUPPLIED-VALUE', $data['updatedAt'], 'updatedAt must be server-set' );
		$this->assertSame( 'home', $data['slug'] );

		// Persisted to post_content.
		$post = get_page_by_path( 'home', OBJECT, 'weave_page' );
		$this->assertNotNull( $post );
		$stored = json_decode( $post->post_content, true );
		$this->assertSame( $data['updatedAt'], $stored['updatedAt'] );
	}

	/**
	 * PUT a body > 1MB -> 413.
	 */
	public function test_pages_put_over_1mb_returns_413(): void {
		$cfg                          = $this->valid_config( 'big' );
		$cfg['sections'][0]['data']['blob'] = str_repeat( 'x', 1100000 );

		$resp = $this->put_config( 'big', $cfg );
		$this->assertSame( 413, $resp->get_status() );
	}

	/**
	 * PUT an invalid config (missing schemaVersion) -> 422 with data.fields.
	 */
	public function test_pages_put_invalid_returns_422_with_fields(): void {
		$cfg = $this->valid_config( 'bad' );
		unset( $cfg['schemaVersion'] );

		$resp = $this->put_config( 'bad', $cfg );
		$this->assertSame( 422, $resp->get_status() );

		$data = $resp->get_data();
		$this->assertSame( 422, $data['data']['status'] );
		$this->assertArrayHasKey( 'fields', $data['data'] );
		$this->assertNotEmpty( $data['data']['fields'] );
	}

	/* ----------------------------- pages: GET ----------------------------- */

	/**
	 * GET an existing page -> 200 with the full ADR-0005 config.
	 */
	public function test_pages_get_item_returns_full_config(): void {
		$this->put_config( 'home', $this->valid_config( 'home' ) );

		$req  = new WP_REST_Request( 'GET', '/weave/v1/pages/home' );
		$resp = rest_do_request( $req );
		$this->assertSame( 200, $resp->get_status() );

		$data = $resp->get_data();
		$this->assertSame( 'home', $data['slug'] );
		$this->assertArrayHasKey( 'sections', $data );
		$this->assertSame( 1, $data['schemaVersion'] );
	}

	/**
	 * GET a missing slug -> 404.
	 */
	public function test_pages_get_item_missing_returns_404(): void {
		$req  = new WP_REST_Request( 'GET', '/weave/v1/pages/nope' );
		$resp = rest_do_request( $req );
		$this->assertSame( 404, $resp->get_status() );
	}

	/**
	 * GET /pages -> metadata-only list; never the sections array.
	 */
	public function test_pages_get_items_is_metadata_only(): void {
		$this->put_config( 'home', $this->valid_config( 'home' ) );
		$this->put_config( 'about', $this->valid_config( 'about' ) );

		$req  = new WP_REST_Request( 'GET', '/weave/v1/pages' );
		$resp = rest_do_request( $req );
		$this->assertSame( 200, $resp->get_status() );

		$items = $resp->get_data();
		$this->assertIsArray( $items );
		$this->assertGreaterThanOrEqual( 2, count( $items ) );
		foreach ( $items as $item ) {
			$this->assertArrayHasKey( 'id', $item );
			$this->assertArrayHasKey( 'slug', $item );
			$this->assertArrayHasKey( 'updatedAt', $item );
			$this->assertArrayNotHasKey( 'sections', $item );
		}
	}

	/* ----------------------- permission choke point ----------------------- */

	/**
	 * Every weave/v1 route uses a real permission_callback (never __return_true).
	 */
	public function test_pages_routes_have_real_permission_callbacks(): void {
		$routes = rest_get_server()->get_routes();
		$found  = false;
		foreach ( $routes as $route => $handlers ) {
			if ( 0 !== strpos( $route, '/weave/v1' ) ) {
				continue;
			}
			// Skip WordPress's auto-registered namespace-index route (/weave/v1):
			// it is public route-discovery metadata, exposes no data, and carries
			// no permission_callback — it is not a Weave data route.
			if ( '/weave/v1' === $route ) {
				continue;
			}
			$found = true;
			foreach ( $handlers as $handler ) {
				$this->assertArrayHasKey( 'permission_callback', $handler );
				$cb = $handler['permission_callback'];
				$this->assertNotSame( '__return_true', $cb );
				$this->assertTrue( is_callable( $cb ) );
			}
		}
		$this->assertTrue( $found, 'No weave/v1 routes were registered' );
	}

	/* --------------------------- sections: POST --------------------------- */

	/**
	 * POST /sections -> 201; server generates the id (UUIDv4), appends last.
	 */
	public function test_sections_post_appends_with_server_id(): void {
		$this->put_config( 'home', $this->valid_config( 'home' ) );

		$req = new WP_REST_Request( 'POST', '/weave/v1/sections' );
		$req->set_header( 'Content-Type', 'application/json' );
		$req->set_body(
			wp_json_encode(
				array(
					'slug'    => 'home',
					'type'    => 'featured-products',
					'data'    => array( 'limit' => 4 ),
					'version' => 1,
				)
			)
		);
		$resp = rest_do_request( $req );
		$this->assertSame( 201, $resp->get_status() );

		$section = $resp->get_data();
		$this->assertArrayHasKey( 'id', $section );
		$this->assertMatchesRegularExpression(
			'/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
			$section['id']
		);
		$this->assertSame( 'featured-products', $section['type'] );

		// post_content sections grew by one with the new section last.
		$post   = get_page_by_path( 'home', OBJECT, 'weave_page' );
		$stored = json_decode( $post->post_content, true );
		$this->assertCount( 2, $stored['sections'] );
		$this->assertSame( $section['id'], $stored['sections'][1]['id'] );
	}

	/**
	 * POST /sections ignores a client-supplied id and generates its own.
	 */
	public function test_sections_post_ignores_client_id(): void {
		$this->put_config( 'home', $this->valid_config( 'home' ) );

		$req = new WP_REST_Request( 'POST', '/weave/v1/sections' );
		$req->set_header( 'Content-Type', 'application/json' );
		$req->set_body(
			wp_json_encode(
				array(
					'slug'    => 'home',
					'id'      => 'client-supplied-id',
					'type'    => 'hero',
					'data'    => array(),
					'version' => 1,
				)
			)
		);
		$resp = rest_do_request( $req );
		$this->assertSame( 201, $resp->get_status() );
		$this->assertNotSame( 'client-supplied-id', $resp->get_data()['id'] );
	}

	/**
	 * POST /sections targeting a non-existent slug -> 404.
	 */
	public function test_sections_post_missing_slug_returns_404(): void {
		$req = new WP_REST_Request( 'POST', '/weave/v1/sections' );
		$req->set_header( 'Content-Type', 'application/json' );
		$req->set_body(
			wp_json_encode(
				array(
					'slug' => 'ghost',
					'type' => 'hero',
				)
			)
		);
		$resp = rest_do_request( $req );
		$this->assertSame( 404, $resp->get_status() );
	}

	/* -------------------------- sections: DELETE -------------------------- */

	/**
	 * DELETE /sections/{id}?slug= -> 200; section removed; id not reused.
	 */
	public function test_sections_delete_removes_by_id(): void {
		$this->put_config( 'home', $this->valid_config( 'home' ) );
		$existing_id = '550e8400-e29b-41d4-a716-446655440000';

		$req = new WP_REST_Request( 'DELETE', "/weave/v1/sections/{$existing_id}" );
		$req->set_query_params( array( 'slug' => 'home' ) );
		$resp = rest_do_request( $req );
		$this->assertSame( 200, $resp->get_status() );

		$post   = get_page_by_path( 'home', OBJECT, 'weave_page' );
		$stored = json_decode( $post->post_content, true );
		$this->assertCount( 0, $stored['sections'] );
		$this->assertTrue( array_is_list( $stored['sections'] ) );
	}

	/**
	 * DELETE a non-existent id -> 404.
	 */
	public function test_sections_delete_unknown_id_returns_404(): void {
		$this->put_config( 'home', $this->valid_config( 'home' ) );

		$req = new WP_REST_Request( 'DELETE', '/weave/v1/sections/00000000-0000-4000-8000-000000000000' );
		$req->set_query_params( array( 'slug' => 'home' ) );
		$resp = rest_do_request( $req );
		$this->assertSame( 404, $resp->get_status() );
	}
}
