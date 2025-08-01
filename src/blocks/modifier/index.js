import { registerBlockType } from '@wordpress/blocks';
import json from './block.json';
import edit from './edit';
import save from './save';
import label from './label';
import icon from './icon';

const { name, ...settings } = json;

registerBlockType(name, {
	...settings,
	icon,
	edit,
	__experimentalLabel: label,
	save,
});
