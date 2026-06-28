<?php

namespace Freemius;

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

return array(
	'environment' => array(
		'type'        => 'string',
		'label'       => __( 'Environment (sandbox/live)', 'freemius' ),
		'description' => __( 'Not implemented (yet)', 'freemius' ),
		'default'     => 'live',
		'enum'        => array( 'sandbox', 'live' ),
	),
);
