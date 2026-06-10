=== Weave ===
Contributors: arcplatform
Tags: woocommerce, headless, rest-api, page-builder
Requires at least: 6.4
Tested up to: 7.0
Requires PHP: 8.1
Requires Plugins: wp-graphql, wp-graphql-woocommerce
WC requires at least: 9.0
Stable tag: 0.1.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Page-config storage + REST API for headless WooCommerce, powering the Weave visual sections editor on the Arc Platform.

== Description ==

Weave stores versioned page configurations as JSON inside a `weave_page` custom post type and exposes an authenticated REST API (`weave/v1`) for a headless Next.js storefront to read and mutate them. On every save it fires an HMAC-signed outbound webhook to a configured Next.js revalidate URL so the storefront's cache stays fresh.

This is the server-side half of Weave. The Next.js consumer (`@weave/next`) and the WP Admin sidebar editor are delivered separately.

== Configuration ==

= Required plugins (`Requires Plugins` header) =

Weave declares `Requires Plugins: wp-graphql, wp-graphql-woocommerce` (WP 6.5+ enforces this at activation). The Arc storefront reads the catalog through WPGraphQL, so a missing or outdated install breaks the headless frontend even though this plugin's own REST surface would still function.

**Minimum safe versions (ADR-0012):** run WPGraphQL at a release that includes the CVE-2026-33290 fix, and keep WPGraphQL for WooCommerce on its latest minor. Pin minor versions in production and watch the upstream security advisories — see `Documentation/Architecture/ADR-0012-supply-chain-hardening.md`.

= Webhook secret (`WEAVE_WEBHOOK_SECRET`) =

The outbound webhook is signed with HMAC-SHA256 using a shared secret defined as a constant in `wp-config.php` (ADR-0007). Generate a >= 32-byte secret and add it to `wp-config.php`:

    define( 'WEAVE_WEBHOOK_SECRET', '<paste output of: openssl rand -hex 32>' );

If the constant is undefined, the webhook is skipped (logged, non-fatal).

= Revalidate URL (`weave_revalidate_url` option) =

The webhook target is read from the WordPress option `weave_revalidate_url`. Set it to your Next.js revalidate endpoint (e.g. `https://store.example/api/revalidate`). If empty, the webhook is skipped.

== Developer notes ==

* Tests run on PHPUnit 9.6 + yoast/phpunit-polyfills against the WordPress core test framework. The PHPUnit 9.6 pin supersedes the earlier "PHPUnit 10" label — the WP core test suite (`WP_UnitTestCase`) is not compatible with PHPUnit 10/11 as of mid-2026.
* Lint: PHPCS + WordPress Coding Standards (`composer lint`).
* Local dev: `pnpm wp:start` boots a wp-env instance with this plugin mapped from source.

== Changelog ==

= 0.1.0 =
* Initial harness + plugin bootstrap skeleton.
