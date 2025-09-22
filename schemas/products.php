<?php

namespace Freemius;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

return array(
	'product_id' => array(
		'label'            => __( 'Product ID', 'freemius' ),
		'type'             => 'integer',
		'required'         => true,
		'default'          => '',
		'description'      => __( 'Required product ID (whether it\'s a plugin, theme, add-on, bundle, or SaaS).', 'freemius' ),
		'isRequired'       => true,
		'isShownByDefault' => true,
	),
	// 'public_key' => array(
	//  'label'            => __( 'Public Key', 'freemius' ),
	//  'type'             => 'string',
	//  'default'          => '',
	//  'description'      => __( 'Required product public key.', 'freemius' ),
	//  'isRequired'       => true,
	//  'isShownByDefault' => true,
	// ),
	'token'      => array(
		'type'        => 'string',
		'input_type'  => 'password',
		'required'    => true,
		'label'       => __( 'Token', 'freemius' ),
		'description' => __(
			'Go to the Freemius Developer Dashboard. Open the Settings page of the relevant product. Click on the API Token tab. Copy the API Bearer Authorization Token from the UI.',
			'freemius'
		),
		'link'        => 'https://dashboard.freemius.com/',
		'default'     => '',
	),
);
