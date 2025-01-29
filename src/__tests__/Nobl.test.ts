import { test, expect } from 'vitest';
import { nobl, NoblCancelled } from '../Nobl';


// These tests work by running a timed loop that increments a counter internally,
// probing the counter externally at specific times during the loop, and comparing
// the collected values.

// Timing constants to strike a balance on:
// - Too big and the tests run too slow
// - Too small and the tests have false failures because they get out of sync internally
const duration = 20; // Nobl's internal duration value
const factor = 5; // How many durations to wait between each sampling "frame"

// Calculate how long from the start of the test to wait before performing a given action.
const frame = (n: number, d = 0, f = 0): number => n * (d || duration) * (f || factor);


test('basics with one sample', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;

	const now = Date.now();
	setTimeout(() => {
		sample1 = count;
	}, frame(1));
	const endTime = now + frame(2);
	while (Date.now() < endTime) {
		count++;
		await nobl();
	}
	
	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	expect(sample1).toBeGreaterThan(0);
	expect(count).toBeGreaterThan(sample1);
});

test('more samples', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

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
		await nobl();
	}

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	expect(sample1).toBeGreaterThan(0);
	expect(sample2).toBeGreaterThan(sample1);
	expect(sample3).toBeGreaterThan(sample2);
	expect(count).toBeGreaterThan(sample3);
});

test('cancel', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	let cancel = false;
	let cancelled = false;

	try {

		setTimeout(() => {
			sample1 = count;
		}, frame(1));
		setTimeout(() => {
			sample2 = count;
			cancel = true;
		}, frame(2));
		setTimeout(() => {
			sample3 = count;
		}, frame(3));
	
		const now = Date.now();
		const endTime = now + frame(4);
		while (Date.now() < endTime) {
			count++;
			await nobl({cancel});
		}

	} catch (e) {
		cancelled = (e instanceof NoblCancelled);
	}

	expect(cancelled).toBe(true);
	expect(sample1).toBeGreaterThan(0);
	expect(sample2).toBeGreaterThan(sample1);
	expect(sample2).toBe(count - 1);
	expect(sample3).toBe(0);
});

test('progress', async () => {
	// Test data
	let count = 0;
	let samples: Array<number> = [];
	let progress = () => {
		samples.push(Date.now());
	};
	
	const endTime = Date.now() + frame(5);
	while (Date.now() < endTime) {
		count++;
		await nobl({progress});
	}
	expect(samples.length).toBeGreaterThan(1);
	for (let i = 1; i < samples.length; i++) {
		const diff = samples[i] - samples[i - 1];
		expect(diff).toBeGreaterThanOrEqual(duration);
	}
});

