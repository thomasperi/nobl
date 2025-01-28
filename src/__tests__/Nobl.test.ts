import { test, expect } from 'vitest';
import { Nobl, NoblCancelled } from '../Nobl';


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

	const nobl = new Nobl();

	// Should not be running initially.
	expect(nobl.running).toBe(false);

	const promise = nobl.run(function* () {
		const now = Date.now();
		setTimeout(() => {
			sample1 = count;
			expect(nobl.running).toBe(true);
		}, frame(1));
		const endTime = now + frame(2);
		while (Date.now() < endTime) {
			count++;
			yield;
		}
		return 'foo';
	});

	// Should be running after `run` is called.
	expect(nobl.running).toBe(true);

	// `run` should return a promise.
	expect(promise instanceof Promise);
	
	// Wait for the loop to finish.
	const result = await promise;

	// Should not be running after the promise resolves.
	expect(nobl.running).toBe(false);

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
	
	const nobl = new Nobl();

	let count: number;
	let result: number;
	let expected: number;
	
	count = 10;
	result = await nobl.run(preGauss(count));
	expected = gauss(count);
	expect(result).toBe(expected);

	count = 1000;
	result = await nobl.run(preGauss(count));
	expected = gauss(count);
	expect(result).toBe(expected);

	count = 1000000;
	result = await nobl.run(preGauss(count));
	expected = gauss(count);
	expect(result).toBe(expected);
});

test('more samples', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	const nobl = new Nobl();

	await nobl.run(function* () {
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

	const nobl = new Nobl();
	await nobl.run(function* () {
		const now = Date.now();
		const endTime = now + frame(4);
		const foo = yield new Promise(resolve => {
			setTimeout(() => {
				resolve('foo');
				sample2 = Date.now();
			}, frame(2));
		});
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

test('yield non-promise', async () => {
	const nobl = new Nobl();
	await nobl.run(function* () {
		const foo = yield new Promise(resolve => {
			setTimeout(() => {
				resolve('foo');
			}, frame(1));
		});
		expect(foo).toBe('foo');
		
		let bar = yield 'bar';
		expect(bar).toBe('bar');

		let nuttin = yield;
		expect(nuttin).toBe(undefined);

		const zote = yield new Promise(resolve => {
			setTimeout(() => {
				resolve('zote');
			}, frame(1));
		});
		expect(zote).toBe('zote');
	});
});

test('cancel', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;
	
	let cancelled = false;

	const nobl = new Nobl();
	try {
	
		setTimeout(() => {
			sample1 = count;
		}, frame(1));
		setTimeout(() => {
			sample2 = count;
			nobl.cancel();
		}, frame(2));
		setTimeout(() => {
			sample3 = count;
		}, frame(3));
		
		await nobl.run(function* () {
			const now = Date.now();
			const endTime = now + frame(4);
			while (Date.now() < endTime) {
				count++;
				yield;
			}
		});
	
	} catch (e) {
		cancelled = (e instanceof NoblCancelled);
	}
	
	expect(cancelled).toBe(true);
	expect(sample1).toBeGreaterThan(0);
	expect(sample2).toBeGreaterThan(sample1);
	expect(sample2).toBe(count);
	expect(sample3).toBe(0);
});
