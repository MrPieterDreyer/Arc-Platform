<?php
/**
 * Arc Platform — wp-env contract-test seeder.
 *
 * Run via:  wp eval-file wp-content/arc-seed/seed.php
 * (invoked for you by Scripts/seed-wp-env.mjs / `pnpm wp:seed`)
 *
 * Idempotent: re-running reuses fixtures by SKU / coupon code / email / option.
 * Slugs are aligned to the contract-test defaults so tests pass even if
 * .env.wp-test is missing. Emits one line for the Node wrapper to parse:
 *
 *   ARC_SEED_RESULT={...json...}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 1 );
}

if ( ! class_exists( 'WooCommerce' ) ) {
	fwrite( STDERR, "WooCommerce is not active — cannot seed.\n" );
	exit( 1 );
}

/**
 * Create (or reuse) a product category term.
 */
function arc_seed_category( $name, $slug ) {
	$term = get_term_by( 'slug', $slug, 'product_cat' );
	if ( $term ) {
		return (int) $term->term_id;
	}
	$res = wp_insert_term( $name, 'product_cat', array( 'slug' => $slug ) );
	return is_wp_error( $res ) ? 0 : (int) $res['term_id'];
}

/**
 * Create (or reuse, by SKU) a published, in-stock simple product.
 */
function arc_seed_simple( $sku, $name, $slug, $price, $cat_id ) {
	$existing = wc_get_product_id_by_sku( $sku );
	if ( $existing ) {
		return (int) $existing;
	}
	$p = new WC_Product_Simple();
	$p->set_name( $name );
	$p->set_slug( $slug );
	$p->set_sku( $sku );
	$p->set_regular_price( (string) $price );
	$p->set_manage_stock( false );
	$p->set_stock_status( 'instock' );
	$p->set_catalog_visibility( 'visible' );
	$p->set_status( 'publish' );
	if ( $cat_id ) {
		$p->set_category_ids( array( $cat_id ) );
	}
	return (int) $p->save();
}

/**
 * Create (or reuse, by SKU) a variable product with two Color variations.
 */
function arc_seed_variable( $sku, $name, $slug, $cat_id ) {
	$existing = wc_get_product_id_by_sku( $sku );
	if ( $existing ) {
		return (int) $existing;
	}
	$product = new WC_Product_Variable();
	$product->set_name( $name );
	$product->set_slug( $slug );
	$product->set_sku( $sku );
	$product->set_status( 'publish' );
	$product->set_catalog_visibility( 'visible' );
	if ( $cat_id ) {
		$product->set_category_ids( array( $cat_id ) );
	}

	$attr = new WC_Product_Attribute();
	$attr->set_name( 'Color' );
	$attr->set_options( array( 'Red', 'Blue' ) );
	$attr->set_visible( true );
	$attr->set_variation( true );
	$product->set_attributes( array( $attr ) );

	$parent_id = (int) $product->save();

	foreach ( array( 'Red', 'Blue' ) as $color ) {
		$variation = new WC_Product_Variation();
		$variation->set_parent_id( $parent_id );
		$variation->set_attributes( array( 'color' => $color ) );
		$variation->set_regular_price( '24.99' );
		$variation->set_manage_stock( false );
		$variation->set_stock_status( 'instock' );
		$variation->save();
	}

	// Sync the parent so its variation data (price range, variation IDs) is
	// populated — without this, WPGraphQL's `variations` connection is empty.
	WC_Product_Variable::sync( $parent_id );

	return $parent_id;
}

/**
 * Create (or reuse, by code) a 10% coupon.
 */
function arc_seed_coupon( $code, $amount ) {
	$existing = wc_get_coupon_id_by_code( $code );
	if ( $existing ) {
		return (int) $existing;
	}
	$coupon = new WC_Coupon();
	$coupon->set_code( $code );
	$coupon->set_discount_type( 'percent' );
	$coupon->set_amount( (float) $amount );
	return (int) $coupon->save();
}

/**
 * Create (or reuse, by email) a customer.
 */
function arc_seed_customer( $email ) {
	$user = get_user_by( 'email', $email );
	if ( $user ) {
		return (int) $user->ID;
	}
	$id = wc_create_new_customer( $email, 'arc_customer', 'Password123!' );
	return is_wp_error( $id ) ? 0 : (int) $id;
}

/**
 * Create (or reuse, by option) a completed order containing the simple product.
 */
function arc_seed_order( $product_id ) {
	$existing = (int) get_option( 'arc_seed_order_id', 0 );
	if ( $existing && wc_get_order( $existing ) ) {
		return $existing;
	}
	$order   = wc_create_order();
	$product = wc_get_product( $product_id );
	if ( $product ) {
		$order->add_product( $product, 1 );
	}
	$order->set_status( 'completed' );
	$order->calculate_totals();
	$order_id = (int) $order->save();
	update_option( 'arc_seed_order_id', $order_id );
	return $order_id;
}

// --- Store config the contract/checkout tests rely on -----------------------
// (Pretty permalinks + rewrite flush are handled by Scripts/seed-wp-env.mjs via
// wp-cli — flush_rewrite_rules() here does not expose WPGraphQL's /graphql route.)

update_option( 'woocommerce_currency', 'USD' );

// Enable Cash on Delivery so checkout / payment-gateway tests see a gateway.
$cod            = get_option( 'woocommerce_cod_settings', array() );
$cod['enabled'] = 'yes';
update_option( 'woocommerce_cod_settings', $cod );

// --- Seed fixtures ----------------------------------------------------------

$category_slug = 'test-collection';
$cat_id        = arc_seed_category( 'Test Collection', $category_slug );
$simple_id     = arc_seed_simple( 'ARC-SIMPLE', 'Arc Test Simple Product', 'test-product', '19.99', $cat_id );
$variable_id   = arc_seed_variable( 'ARC-VARIABLE', 'Arc Test Variable Product', 'test-variable', $cat_id );
$coupon_id     = arc_seed_coupon( 'TEST10', 10 );
$customer_id   = arc_seed_customer( 'arc-customer@example.com' );
$order_id      = arc_seed_order( $simple_id );

echo 'ARC_SEED_RESULT=' . wp_json_encode(
	array(
		'product_id'             => $simple_id,
		'product_slug'           => 'test-product',
		'variable_product_id'    => $variable_id,
		'variable_product_slug'  => 'test-variable',
		'coupon_code'            => 'TEST10',
		'coupon_id'              => $coupon_id,
		'collection_slug'        => $category_slug,
		'category_id'            => $cat_id,
		'order_id'               => $order_id,
		'customer_id'            => $customer_id,
		'customer_email'         => 'arc-customer@example.com',
	)
) . "\n";
