import { test } from 'vitest';
import { Nobl, NoblCancelled } from '../Nobl';
import assert from 'assert';


// These tests work by running a timed loop that increments a counter internally,
// probing the counter externally at specific times during the loop, and comparing
// the collected values.

// Timing constants to strike a balance on:
// - Too big and the tests run too slow
// - Too small and the tests have false failures because they get out of sync internally
const duration = 10; // The duration option to send to each Nobl
const factor = 4; // How many durations to wait between each sampling "frame"

// Calculate how long from the start of the test to wait before performing a given action.
const frame = (n: number): number => n * duration * factor;


test('default options, one sample', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;

	const nobl = new Nobl();

	assert.equal(nobl.running, false);

	const promise = nobl.start(function* () {
		const now = Date.now();
		setTimeout(() => {
			sample1 = count;
			assert.equal(nobl.running, true);
		}, 50);
		const endTime = now + 100;
		while (Date.now() < endTime) {
			count++;
			yield;
		}
		return 'foo';
	});

	// That should return a promise.
	assert.equal(promise instanceof Promise, true);

	// Wait for the loop to finish.
	const result = await promise;

	assert.equal(nobl.running, false);

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	assert(sample1 > 0);
	assert(count > sample1);

	// The promise should resolve to the return value.
	assert.equal(result, 'foo');
});

test('more samples, shorter duration', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	const nobl = new Nobl();
	nobl.duration = duration;

	await nobl.start(function* () {
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
	assert(sample1 > 0);
	assert(sample2 > sample1);
	assert(sample3 > sample2);
	assert(count > sample3);
});

test('sleep', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	// Start a loop that lasts 400 ms.
	const nobl = new Nobl();
	nobl.duration = duration;
	const promise = nobl.start(function* () {
		const now = Date.now();
		assert.equal(nobl.sleeping, false);
		assert.equal(nobl.waiting, false);

		const sleepStart = now + frame(1); // before the sample1 time below
		setTimeout(() => {
			sample1 = count;
			assert.equal(nobl.sleeping, true);
			assert.equal(nobl.waiting, true);
		}, frame(2));
		setTimeout(() => {
			sample2 = count;
			assert.equal(nobl.sleeping, true);
			assert.equal(nobl.waiting, true);
		}, frame(3));
		const sleepStop = now + frame(4); // after the sample2 time below
		setTimeout(() => {
			sample3 = count;
			assert.equal(nobl.sleeping, false);
			assert.equal(nobl.waiting, false);
		}, frame(5));
		const endTime = now + frame(6);

		const sleepDuration = sleepStop - sleepStart;
		let slept = false;
		while (Date.now() < endTime) {
			count++;
			if (!slept && Date.now() >= sleepStart) {
				slept = true;
				nobl.sleep(sleepDuration);
			}
			yield;
		}
	});

	// Wait for the loop to finish.
	await promise;

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	assert(sample1 > 0);
	assert(sample2 === sample1);
	assert(sample3 > sample2);
	assert(count > sample3);
});

test('wait', async () => {
	// Basically a copy of the test for `sleep`, which is implemented via `wait`

	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	const nobl = new Nobl();
	nobl.duration = duration;
	const promise = nobl.start(function* () {
		const now = Date.now();
		assert.equal(nobl.sleeping, false);
		assert.equal(nobl.waiting, false);

		const sleepStart = now + frame(1); // before the sample1 time below
		setTimeout(() => {
			sample1 = count;
			assert.equal(nobl.sleeping, false);
			assert.equal(nobl.waiting, true);
		}, frame(2));
		setTimeout(() => {
			sample2 = count;
			assert.equal(nobl.sleeping, false);
			assert.equal(nobl.waiting, true);
		}, frame(3));
		const sleepStop = now + frame(4); // after the sample2 time below
		setTimeout(() => {
			sample3 = count;
			assert.equal(nobl.sleeping, false);
			assert.equal(nobl.waiting, false);
		}, frame(5));
		const endTime = now + frame(6);

		const sleepDuration = sleepStop - sleepStart;
		let slept = false;
		while (Date.now() < endTime) {
			count++;
			if (!slept && Date.now() >= sleepStart) {
				slept = true;
				nobl.wait(
					new Promise(resolve => setTimeout(resolve, sleepDuration))
				);
			}
			yield;
		}
	});

	// Wait for the loop to finish.
	await promise;

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	assert(sample1 > 0);
	assert(sample2 === sample1);
	assert(sample3 > sample2);
	assert(count > sample3);
});

test('progress synchronous', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	const now = Date.now();
	const sample1time = now + frame(1);
	const sample2time = now + frame(2);
	const sample3time = now + frame(3);
	const endTime = now + frame(4);

	const nobl = new Nobl();
	nobl.duration = duration;
	nobl.addListener('progress', () => {
		const now = Date.now();
		if (sample1 === 0 && now >= sample1time) {
			sample1 = count;
		}
		if (sample2 === 0 && now >= sample2time) {
			sample2 = count;
		}
		if (sample3 === 0 && now >= sample3time) {
			sample3 = count;
		}
	});
	const promise = nobl.start(function* () {
		while (Date.now() < endTime) {
			count++;
			yield;
		}
	});

	// Wait for the loop to finish.
	await promise;

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	assert(sample1 > 0);
	assert(sample2 > sample1);
	assert(sample3 > sample2);
	assert(count > sample3);
});

test('progress asynchronous', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	// Similar to the sleep test, except that here we're "sleeping"
	// inside the progress function.
	const start = Date.now();
	const startProgress = start + frame(1);
	setTimeout(() => {
		sample1 = count;
	}, frame(2));
	setTimeout(() => {
		sample2 = count;
	}, frame(3));
	const endProgress = start + frame(4);
	setTimeout(() => {
		sample3 = count;
	}, frame(5));
	const endTime = Date.now() + frame(6);

	const progressDuration = endProgress - startProgress;
	let slept = false;
	const nobl = new Nobl();
	nobl.duration = duration;
	nobl.addListener(
		'progress',
		() =>
			new Promise<void>(resolve => {
				if (!slept && Date.now() >= startProgress) {
					slept = true;
					setTimeout(resolve, progressDuration);
				} else {
					resolve();
				}
			})
	);
	const promise = nobl.start(function* () {
		while (Date.now() < endTime) {
			count++;
			yield;
		}
	});

	// Wait for the loop to finish.
	await promise;

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	assert(sample1 > 0);
	assert(sample2 === sample1);
	assert(sample3 > sample2);
	assert(count > sample3);
});

test('pause, next, resume', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	setTimeout(() => {
		nobl.pause();
	}, frame(1));
	setTimeout(() => {
		sample1 = count;
		assert.equal(nobl.paused, true);
	}, frame(2));
	setTimeout(() => {
		nobl.next();
		assert.equal(nobl.paused, true);
	}, frame(3));
	setTimeout(() => {
		sample2 = count;
		assert.equal(nobl.paused, true);
	}, frame(4));
	setTimeout(() => {
		nobl.resume();
	}, frame(5));
	setTimeout(() => {
		sample3 = count;
		assert.equal(nobl.paused, false);
	}, frame(6));
	const endTime = Date.now() + frame(7);

	const nobl = new Nobl();
	nobl.duration = duration;
	const promise = nobl.start(function* () {
		while (Date.now() < endTime) {
			count++;
			yield;
		}
	});

	assert.equal(nobl.paused, false);

	// Wait for the loop to finish.
	await promise;

	// Each sample should be greater than the one before it,
	// and the end count should be greater than the last sample.
	assert(sample1 > 0);
	assert(sample2 === sample1 + 1);
	assert(sample3 > sample2);
	assert(count > sample3);
});

test('cancel', async () => {
	// Test data
	let count = 0;
	let sample1 = 0;
	let sample2 = 0;
	let sample3 = 0;

	let after = false;
	let nobl: Nobl;

	const now = Date.now();

	setTimeout(() => {
		sample1 = count;
	}, frame(1));
	setTimeout(() => {
		sample2 = count;
		if (nobl) {
			nobl.cancel();
		}
	}, frame(2));
	setTimeout(() => {
		sample3 = count;
	}, frame(3));

	const endTime = now + frame(4);

	const timeoutPromise = new Promise<void>(resolve => {
		setTimeout(resolve, frame(5));
	});

	let cancelled = false;
	try {
		nobl = new Nobl();
		nobl.duration = duration;
		await nobl.start(function* () {
			while (Date.now() < endTime) {
				count++;
				yield;
			}
		});
		after = true;
	} catch (e) {
		if (e instanceof NoblCancelled) {
			cancelled = true;
		} else {
			throw e;
		}
	}

	assert(cancelled);
	assert(!after);

	await timeoutPromise; // already in progress from above

	assert(sample1 > 0);
	assert(sample2 > sample1);
	assert(sample3 === sample2);
	assert(count === sample3);
});

test('progress with pause and next', async () => {
	let count = 0;
	let i = 0;
	const progress = () => {
		count++;
	};
	const nobl = new Nobl();
	nobl.duration = duration;
	nobl.addListener('progress', progress);
	nobl.pause();
	nobl.start(function* () {
		for (i = 10; i < 20; i++) {
			yield;
		}
	});

	assert.equal(i, 0);
	assert.equal(count, 1); // The first `progress` runs on `do` even though paused.

	nobl.next();
	assert.equal(i, 10);
	assert.equal(count, 2);

	nobl.next();
	assert.equal(i, 11);
	assert.equal(count, 3);
});

// to-do:

// test violating the `onlyIf...` methods

// test a loop shorter than the duration setting

// test next with wait
