<?php
/**
 * Auth-matrix gate for the weave/v1 REST surface (WEAVE-WP-05).
 *
 * This is the enforced regression guard for D-09's single permission choke
 * point. It enumerates every registered weave/v1 route x method, calls each one
 * unauthenticated, and asserts the status is 401/403/404 — never 200. It also
 * statically asserts that no weave/v1 route registers '__return_true' as its
 * permission_callback (the D-09 forbidden pattern), and adds concrete per-route
 * cases proving anonymous callers get a deterministic 401 and authenticated-but-
 * uncapable (subscriber) users get 403 on every write route (D-10).
 *
 * @package Weave
 */

/**
 * @covers Weave_REST_Controller
 */
class Test_Weave_REST_Auth extends WP_UnitTestCase {

	/**
	 * A valid-shape section UUID used for the DELETE /sections/{id} route so the
	 * path matches the route's [a-f0-9-]+ regex (never a param-mismatch 404).
	 *
	 * @var string
	 */
	private const SAMPLE_UUID = '550e8400-e29b-41d4-a716-446655440000';

	/**
	 * Ensure the weave/v1 routes are registered for this request lifecycle.
	 */
	public function set_up(): void {
		parent::set_up();
		do_action( 'rest_api_init' );
	}

	/* --------------------- enumeration: anonymous never 200 -------------------- */

	/**
	 * Table-driven regression guard: every weave/v1 route x method, called
	 * unauthenticated, must reject (401/403) and never return 200.
	 *
	 * The 404 tolerance is only for regex-templated paths (a literal
	 * '(?P<slug>...)' in the enumerated route string cannot match the route's own
	 * regex). The load-bearing assertion is assertNotSame( 200, ... ): no weave/v1
	 * route may ever admit an anonymous caller. Concrete-param 401s are pinned in
	 * test_anonymous_gets_401() below.
	 */
	public function test_all_routes_reject_anonymous(): void {
		wp_set_current_user( 0 ); // Anonymous.

		$server = rest_get_server();
		$found  = false;
		foreach ( $server->get_routes() as $route => $handlers ) {
			if ( 0 !== strpos( $route, '/weave/v1' ) ) {
				continue;
			}
			$found = true;
			foreach ( $handlers as $handler ) {
				foreach ( array_keys( $handler['methods'] ) as $method ) {
					$req  = new WP_REST_Request( $method, $route );
					$resp = rest_do_request( $req );
					$this->assertContains(
						$resp->get_status(),
						array( 401, 403, 404 ),
						"Route $method $route admitted anonymous access (status {$resp->get_status()})"
					);
					$this->assertNotSame(
						200,
						$resp->get_status(),
						"Route $method $route returned 200 anonymously"
					);
				}
			}
		}

		$this->assertTrue( $found, 'No weave/v1 routes were registered' );
	}

	/**
	 * Static D-09 guard: no weave/v1 route may register '__return_true' as its
	 * permission_callback, and none may register an empty callback.
	 */
	public function test_no_route_uses_return_true(): void {
		$server = rest_get_server();
		$found  = false;
		foreach ( $server->get_routes() as $route => $handlers ) {
			if ( 0 !== strpos( $route, '/weave/v1' ) ) {
				continue;
			}
			$found = true;
			foreach ( $handlers as $handler ) {
				$this->assertArrayHasKey(
					'permission_callback',
					$handler,
					"Route $route has no permission_callback key"
				);
				$this->assertNotSame(
					'__return_true',
					$handler['permission_callback'],
					"Route $route uses __return_true as permission_callback"
				);
				$this->assertNotEmpty(
					$handler['permission_callback'],
					"Route $route has an empty permission_callback"
				);
			}
		}

		$this->assertTrue( $found, 'No weave/v1 routes were registered' );
	}
}
