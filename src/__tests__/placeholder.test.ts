// A minimal file to make eslint look at Nobl.ts

import { test } from 'vitest';
import { Nobl } from '../Nobl';

test('foo', () => {
	const nobl = new Nobl();
	console.log(nobl);
});
