<?php
/**
 * Weave REST controller — the weave/v1 read/write surface (WEAVE-WP-02/03/04).
 *
 * Exposes the page-config storage over REST:
 *   - GET  /weave/v1/pages                  metadata-only list (ADR-0005 rule)
 *   - GET  /weave/v1/pages/{slug}           full ADR-0005 config
 *   - PUT  /weave/v1/pages/{slug}           validate (422) + 1MB gate (413) + write
 *   - POST /weave/v1/sections               append a section (server-generated id)
 *   - DELETE /weave/v1/sections/{id}        remove a section by id
 *
 * Every route's permission_callback funnels through ONE shared require_cap()
 * choke point (D-09). Reads require the `read` capability, writes require
 * `edit_posts` (D-10). No route is left publicly open.
 *
 * @package Weave
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * The weave/v1 REST controller.
 *
 * @since 0.1.0
 */
class Weave_REST_Controller extends WP_REST_Controller {

	/**
	 * REST namespace for all Weave routes.
	 *
	 * @var string
	 */
	protected $namespace = 'weave/v1';

	/**
	 * Hard request-body cap in bytes (ADR-0005 / D-05). Above this -> 413.
	 *
	 * @var int
	 */
	private const MAX_BODY_BYTES = 1048576;

	/**
	 * Register all weave/v1 routes (RESEARCH Pattern 3 route shapes).
	 *
	 * Hooked to `rest_api_init` by Weave_Plugin. Every entry passes a
	 * permission_callback routed through the shared choke point.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/pages',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'read_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/pages/(?P<slug>[a-z0-9-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'read_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'write_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/sections',
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_section' ),
					'permission_callback' => array( $this, 'write_permissions_check' ),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/sections/(?P<id>[a-f0-9-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'delete_section' ),
					'permission_callback' => array( $this, 'write_permissions_check' ),
				),
			)
		);
	}

	/* ------------------------- permission choke point ------------------------ */

	/**
	 * THE single permission choke point (D-09).
	 *
	 * Returns an explicit WP_Error so 401 (logged-out) and 403 (logged-in but
	 * uncapable) are deterministic (RESEARCH Pitfall 3). Never opens publicly.
	 *
	 * @param string $cap Required capability.
	 * @return true|WP_Error
	 */
	private function require_cap( string $cap ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'weave_unauthorized', 'Authentication required.', array( 'status' => 401 ) );
		}
		if ( ! current_user_can( $cap ) ) {
			return new WP_Error( 'weave_forbidden', 'Insufficient permissions.', array( 'status' => 403 ) );
		}
		return true;
	}

	/**
	 * Read permission callback — requires the `read` capability (D-10).
	 *
	 * @param WP_REST_Request $request Request (unused; signature required by WP).
	 * @return true|WP_Error
	 */
	public function read_permissions_check( $request ) {
		unset( $request );
		return $this->require_cap( 'read' );
	}

	/**
	 * Write permission callback — requires `edit_posts` (D-10).
	 *
	 * @param WP_REST_Request $request Request (unused; signature required by WP).
	 * @return true|WP_Error
	 */
	public function write_permissions_check( $request ) {
		unset( $request );
		return $this->require_cap( 'edit_posts' );
	}

	/* -------------------------------- pages --------------------------------- */

	/**
	 * GET /pages — metadata-only list (ADR-0005 list-endpoint rule).
	 *
	 * Maps each weave_page to `{ id, slug, updatedAt }`; NEVER the sections array.
	 * updatedAt comes from the decoded post_content, falling back to
	 * post_modified_gmt if the stored JSON lacks it.
	 *
	 * @param WP_REST_Request $request Request (unused).
	 * @return WP_REST_Response
	 */
	public function get_items( $request ) {
		unset( $request );

		$posts = get_posts(
			array(
				'post_type'   => Weave_CPT::POST_TYPE,
				'numberposts' => -1,
				'post_status' => 'publish',
			)
		);

		$items = array();
		foreach ( $posts as $post ) {
			$decoded    = json_decode( $post->post_content, true );
			$updated_at = ( is_array( $decoded ) && isset( $decoded['updatedAt'] ) && is_string( $decoded['updatedAt'] ) )
				? $decoded['updatedAt']
				: $post->post_modified_gmt;

			$items[] = array(
				'id'        => $post->ID,
				'slug'      => $post->post_name,
				'updatedAt' => $updated_at,
			);
		}

		return new WP_REST_Response( $items, 200 );
	}

	/**
	 * GET /pages/{slug} — return the full stored ADR-0005 config.
	 *
	 * @param WP_REST_Request $request Request with the `slug` path param.
	 * @return WP_REST_Response|WP_Error 404 when the page does not exist.
	 */
	public function get_item( $request ) {
		$post = get_page_by_path( $request['slug'], OBJECT, Weave_CPT::POST_TYPE );
		if ( null === $post ) {
			return new WP_Error( 'weave_not_found', 'Page not found.', array( 'status' => 404 ) );
		}

		$data = json_decode( $post->post_content, true );
		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * PUT /pages/{slug} — 1MB gate (413), validate (422), write with server-set
	 * updatedAt (RESEARCH Pattern 4 / D-04 / D-05 / D-07).
	 *
	 * Resolves or creates the weave_page by slug, then writes post_content. The
	 * write fires save_post_weave_page -> Plan 04's webhook (loop closed).
	 *
	 * @param WP_REST_Request $request Request with the `slug` path param + JSON body.
	 * @return WP_REST_Response|WP_Error
	 */
	public function update_item( $request ) {
		$raw = $request->get_body();
		if ( strlen( $raw ) > self::MAX_BODY_BYTES ) {
			return new WP_Error( 'weave_too_large', 'Page config exceeds 1MB.', array( 'status' => 413 ) );
		}

		$data   = json_decode( $raw, true );
		$errors = Weave_Validator::validate_page_config( $data );
		if ( $errors ) {
			return new WP_Error(
				'weave_validation_failed',
				'Invalid page config.',
				array(
					'status' => 422,
					'fields' => $errors,
				)
			);
		}

		// Server-authoritative fields (D-04).
		$data['updatedAt'] = gmdate( 'c' );
		$data['slug']      = $request['slug'];

		$write = $this->write_config( $request['slug'], $data );
		if ( is_wp_error( $write ) ) {
			return $write;
		}

		return new WP_REST_Response( $data, 200 );
	}

	/* --------------------------- shared write path -------------------------- */

	/**
	 * Resolve-or-create the weave_page for a slug and persist its config JSON.
	 *
	 * Single atomic post_content write via wp_insert_post/wp_update_post (no raw
	 * SQL — PROJECT.md §4). Returns the post id or a WP_Error on failure.
	 *
	 * @param string              $slug Page slug.
	 * @param array<string,mixed> $data Full config to encode into post_content.
	 * @return int|WP_Error Post id on success.
	 */
	private function write_config( string $slug, array $data ) {
		$encoded = wp_json_encode( $data );
		$post    = get_page_by_path( $slug, OBJECT, Weave_CPT::POST_TYPE );

		if ( null === $post ) {
			$post_id = wp_insert_post(
				array(
					'post_type'    => Weave_CPT::POST_TYPE,
					'post_name'    => $slug,
					'post_title'   => $slug,
					'post_status'  => 'publish',
					'post_content' => $encoded,
				),
				true
			);
		} else {
			$post_id = wp_update_post(
				array(
					'ID'           => $post->ID,
					'post_content' => $encoded,
				),
				true
			);
		}

		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}
		return (int) $post_id;
	}

	/* ------------------------------ sections -------------------------------- */

	/**
	 * POST /sections — append a section to a page identified by slug (D-08).
	 *
	 * Slug is taken from the JSON body (Claude's Discretion — a POST has no path
	 * slug, and the body is the natural carrier for the create payload). The
	 * section `id` is ALWAYS server-generated via Weave_CPT::generate_section_id()
	 * — any client-supplied `id` is ignored (never trust client ids). The mutated
	 * config is revalidated before the single atomic post_content write
	 * (defense-in-depth: a mutation can never persist an invalid config).
	 *
	 * @param WP_REST_Request $request Request with a JSON body `{ slug, type, data?, version? }`.
	 * @return WP_REST_Response|WP_Error 201 on success; 404 missing slug; 422 invalid result.
	 */
	public function create_section( $request ) {
		$body = json_decode( $request->get_body(), true );
		$slug = is_array( $body ) && isset( $body['slug'] ) ? (string) $body['slug'] : '';

		$post = get_page_by_path( $slug, OBJECT, Weave_CPT::POST_TYPE );
		if ( null === $post ) {
			return new WP_Error( 'weave_not_found', 'Page not found.', array( 'status' => 404 ) );
		}

		$config = json_decode( $post->post_content, true );
		if ( ! is_array( $config ) || ! isset( $config['sections'] ) || ! is_array( $config['sections'] ) ) {
			return new WP_Error( 'weave_corrupt_config', 'Stored page config is not valid.', array( 'status' => 422 ) );
		}

		// Always server-generate the id; ignore any client-supplied id (D-08).
		$section = array(
			'id'      => Weave_CPT::generate_section_id(),
			'type'    => isset( $body['type'] ) ? $body['type'] : '',
			'data'    => isset( $body['data'] ) && is_array( $body['data'] ) ? $body['data'] : array(),
			'version' => isset( $body['version'] ) && is_int( $body['version'] ) ? $body['version'] : 1,
		);

		$config['sections'][] = $section;
		$config['updatedAt']  = gmdate( 'c' );
		$config['slug']       = $post->post_name;

		$errors = Weave_Validator::validate_page_config( $config );
		if ( $errors ) {
			return new WP_Error(
				'weave_validation_failed',
				'Invalid page config.',
				array(
					'status' => 422,
					'fields' => $errors,
				)
			);
		}

		$write = $this->write_config( $post->post_name, $config );
		if ( is_wp_error( $write ) ) {
			return $write;
		}

		return new WP_REST_Response( $section, 201 );
	}

	/**
	 * DELETE /sections/{id} — remove a section by id (D-08).
	 *
	 * The id comes from the path; the target page slug comes from the `?slug=`
	 * query param (Claude's Discretion — a DELETE often has no body). The section
	 * whose `id` matches is filtered out and the list re-indexed (kept a JSON
	 * list). A non-matching id -> 404. Deleted ids are never reused because every
	 * create mints a fresh UUID. The mutated config is revalidated before the
	 * single atomic write.
	 *
	 * @param WP_REST_Request $request Request with the `id` path param + `slug` query param.
	 * @return WP_REST_Response|WP_Error 200 on success; 404 missing page/section.
	 */
	public function delete_section( $request ) {
		$slug = (string) $request->get_param( 'slug' );
		$id   = (string) $request['id'];

		$post = get_page_by_path( $slug, OBJECT, Weave_CPT::POST_TYPE );
		if ( null === $post ) {
			return new WP_Error( 'weave_not_found', 'Page not found.', array( 'status' => 404 ) );
		}

		$config = json_decode( $post->post_content, true );
		if ( ! is_array( $config ) || ! isset( $config['sections'] ) || ! is_array( $config['sections'] ) ) {
			return new WP_Error( 'weave_corrupt_config', 'Stored page config is not valid.', array( 'status' => 422 ) );
		}

		$kept    = array();
		$removed = false;
		foreach ( $config['sections'] as $section ) {
			if ( is_array( $section ) && isset( $section['id'] ) && $section['id'] === $id ) {
				$removed = true;
				continue;
			}
			$kept[] = $section;
		}

		if ( ! $removed ) {
			return new WP_Error( 'weave_not_found', 'Section not found.', array( 'status' => 404 ) );
		}

		$config['sections']  = array_values( $kept ); // Re-index — keep a JSON list.
		$config['updatedAt'] = gmdate( 'c' );
		$config['slug']      = $post->post_name;

		$errors = Weave_Validator::validate_page_config( $config );
		if ( $errors ) {
			return new WP_Error(
				'weave_validation_failed',
				'Invalid page config.',
				array(
					'status' => 422,
					'fields' => $errors,
				)
			);
		}

		$write = $this->write_config( $post->post_name, $config );
		if ( is_wp_error( $write ) ) {
			return $write;
		}

		return new WP_REST_Response( array( 'deleted' => $id ), 200 );
	}
}
