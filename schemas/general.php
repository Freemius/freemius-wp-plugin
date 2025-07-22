<?php

namespace Freemius;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

return array(
	'debug_mode' => array(
		'type'        => 'boolean',
		'label'       => __( 'Enable debug mode', 'freemius' ),
		'description' => __( 'Not implemented (yet)', 'freemius' ),
		'default'     => false,
	),
);
