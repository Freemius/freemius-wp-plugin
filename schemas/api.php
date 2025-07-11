<?php

namespace Freemius;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

return array(
	'public_key'   => array(
		'type'        => 'string',
		'label'       => __( 'Public Key', 'freemius' ),
		'description' => __( 'Public Key', 'freemius' ),
		'link'        => 'https://dashboard.freemius.com/#!/profile/',
		'default'     => '',
	),
	'secret_key'   => array(
		'type'        => 'string',
		'label'       => __( 'Secret Key', 'freemius' ),
		'description' => __( 'Secret Key', 'freemius' ),
		'default'     => '',
	),
	'token'        => array(
		'type'        => 'string',
		'label'       => __( 'Token', 'freemius' ),
		'description' => __( 'Token', 'freemius' ),
		'default'     => '',
	),
	'developer_id' => array(
		'type'        => 'string',
		'label'       => __( 'Developer ID', 'freemius' ),
		'description' => __( 'Developer ID', 'freemius' ),
		'default'     => '',
	),
	'user_id'      => array(
		'type'        => 'string',
		'label'       => __( 'User ID', 'freemius' ),
		'description' => __( 'User ID', 'freemius' ),
		'default'     => '',
	),
	'environment'  => array(
		'type'        => 'string',
		'label'       => __( 'Environment (sandbox/live)', 'freemius' ),
		'description' => __( 'Environment (sandbox/live)', 'freemius' ),
		'default'     => 'sandbox',
		'enum'        => array( 'sandbox', 'live' ),
	),
);
