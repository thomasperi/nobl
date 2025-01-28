import { test, expect } from 'vitest';
import { NoblAborted, nobl, wait } from '../Nobl';


// These tests work by running a timed loop that increments a counter internally,
// probing the counter externally at specific times during the loop, and comparing
// the collected values.

// Timing constants to strike a balance on:
// - Too big and the tests run too slow
// - Too small and the tests have false failures because they get out of sync internally
const duration = 20; // Nobl's internal duration value
const factor = 5; // How many durations to wait between each sampling "frame"

// Calculate how long from the start of the test to wait before performing a given action.
const frame = (n: number): number => n * duration * factor;


test('basics with one sample', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;

	const promise = nobl(function* () {
		const now = Date.now();
		setTimeout(() => {
			sample1 = count;
		}, frame(1));
		const endTime = now + frame(2);
		while (Date.now() < endTime) {
			count++;
			yield;
		}
		return 'foo';
	});

	// `run` should return a promise.
	expect(promise instanceof Promise);
	
	// Wait for the loop to finish.
	const result = await promise;

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	expect(sample1).toBeGreaterThan(0);
	expect(count).toBeGreaterThan(sample1);

	// The promise should resolve to the generator's return value.
	expect(result).toBe('foo');
});

test('pass iterator instead of generator function', async () => {
	function* preGauss(n: number) {
		let sum = 0;
		for (let i = 1; i <= n; i++) {
			sum += i;
			yield;
		}
		return sum;
	}
	function gauss (n: number) {
		return n * (n + 1) / 2;
	}
	
	let count: number;
	let result: number;
	let expected: number;
	
	count = 10;
	result = await nobl(preGauss(count));
	expected = gauss(count);
	expect(result).toBe(expected);

	count = 1000;
	result = await nobl(preGauss(count));
	expected = gauss(count);
	expect(result).toBe(expected);

	count = 1000000;
	result = await nobl(preGauss(count));
	expected = gauss(count);
	expect(result).toBe(expected);
});

test('more samples', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	await nobl(function* () {
		const now = Date.now();
		setTimeout(() => {
			sample1 = count;
		}, frame(1));
		setTimeout(() => {
			sample2 = count;
		}, frame(2));
		setTimeout(() => {
			sample3 = count;
		}, frame(3));
		const endTime = now + frame(4);
		
		console.log({now, endTime});

		while (Date.now() < endTime) {
			count++;
			yield;
		}
	});

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	expect(sample1).toBeGreaterThan(0);
	expect(sample2).toBeGreaterThan(sample1);
	expect(sample3).toBeGreaterThan(sample2);
	expect(count).toBeGreaterThan(sample3);
});

test('yield non-promise', async () => {
	await nobl(function* () {
		const foo = wait(yield new Promise(resolve => {
			setTimeout(() => {
				resolve('foo');
			}, frame(1));
		}));
		expect(foo).toBe('foo');
	
		let bar = yield 'bar';
		expect(bar).toBe('bar');

		let nuttin = yield;
		expect(nuttin).toBe(undefined);

		const zote = wait(yield new Promise(resolve => {
			setTimeout(() => {
				resolve('zote');
			}, frame(1));
		}));
		expect(zote).toBe('zote');
	});
});

test('yield promise', async () => {
	// Test data
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;
	let sample4 = 0;

	setTimeout(() => {
		sample1 = Date.now();
	}, frame(1));
	setTimeout(() => {
		sample3 = Date.now();
	}, frame(3));

	await nobl(function* () {
		const now = Date.now();
		const endTime = now + frame(4);
		const foo = wait(yield new Promise(resolve => {
			setTimeout(() => {
				resolve('foo');
				sample2 = Date.now();
			}, frame(2));
		}));
		expect(foo).toBe('foo');
		while (Date.now() < endTime) {
			yield;
		}
		sample4 = Date.now();
	});
	
	expect(sample1).toBeGreaterThan(0);
	expect(sample2).toBeGreaterThan(sample1);
	expect(sample3).toBeGreaterThan(sample2);
	expect(sample4).toBeGreaterThan(sample3);
});

test('yielded promise rejected', async () => {
	let where = '';
	try {
		await nobl(function* () {
			try {
				wait(yield new Promise((resolve, reject) => {
					void resolve;
					setTimeout(() => {
						reject('zote');
					}, 0);
				}));
			} catch (e) {
				where = `inside ${e}`;
			}
		});
	} catch (e) {
		where = `outside ${e}`;
	}
	expect(where).toBe('inside zote');
});

test('abort', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;
	
	let aborted = false;

	let ac = new AbortController();
	let { signal } = ac;

	try {
	
		setTimeout(() => {
			sample1 = count;
		}, frame(1));
		setTimeout(() => {
			sample2 = count;
			ac.abort();
		}, frame(2));
		setTimeout(() => {
			sample3 = count;
		}, frame(3));
		
		await nobl(function* () {
			const now = Date.now();
			const endTime = now + frame(4);
			while (Date.now() < endTime) {
				count++;
				yield;
			}
		}, { signal });
	
	} catch (e) {
		aborted = (e instanceof NoblAborted);
	}
	
	expect(aborted).toBe(true);
	expect(sample1).toBeGreaterThan(0);
	expect(sample2).toBeGreaterThan(sample1);
	expect(sample2).toBe(count);
	expect(sample3).toBe(0);
});
