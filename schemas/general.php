<?php

namespace Freemius;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

return array(
	'token' => array(
		'type'        => 'string',
		'input_type'  => 'password',
		'label'       => __( 'Token', 'freemius' ),
		'description' => __(
			'Go to the Freemius Developer Dashboard. Open the Settings page of the relevant product. Click on the API Token tab. Copy the API Bearer Authorization Token from the UI.',
			'freemius'
		),
		'link'        => 'https://dashboard.freemius.com/',
		'default'     => '',
	),
	// 'environment' => array(
	//  'type'        => 'string',
	//  'label'       => __( 'Environment (sandbox/live)', 'freemius' ),
	//  'description' => __( 'Not implemented (yet)', 'freemius' ),
	//  'default'     => 'sandbox',
	//  'enum'        => array( 'sandbox', 'live' ),
	// ),
	// 'debug_mode'  => array(
	//  'type'        => 'boolean',
	//  'label'       => __( 'Enable debug mode', 'freemius' ),
	//  'description' => __( 'Not implemented (yet)', 'freemius' ),
	//  'default'     => false,
	// ),
);
