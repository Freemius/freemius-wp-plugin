<?php

namespace Freemius;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

return array(
	'plugin_name'      => array(
		'type'        => 'string',
		'label'       => __( 'Plugin name', 'freemius' ),
		'description' => __( 'Plugin name', 'freemius' ),
		'default'     => '',
	),
	'plugin_version'   => array(
		'type'        => 'string',
		'label'       => __( 'Plugin version', 'freemius' ),
		'description' => __( 'Plugin version', 'freemius' ),
		'default'     => '',
	),
	'enable_analytics' => array(
		'type'        => 'boolean',
		'label'       => __( 'Enable analytics tracking', 'freemius' ),
		'description' => __( 'Enable analytics tracking', 'freemius' ),
		'default'     => false,
	),
	'enable_updates'   => array(
		'type'        => 'boolean',
		'label'       => __( 'Enable automatic updates', 'freemius' ),
		'description' => __( 'Enable automatic updates', 'freemius' ),
		'default'     => true,
	),
	'debug_mode'       => array(
		'type'        => 'boolean',
		'label'       => __( 'Enable debug mode', 'freemius' ),
		'description' => __( 'Enable debug mode', 'freemius' ),
		'default'     => false,
	),
);
