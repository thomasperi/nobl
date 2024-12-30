export interface NoblEvent {
	type: NoblEventType;
	nobl: Nobl;
}

export type NoblListener = (event: NoblEvent) => void;

export type NoblEventType =
	| 'cancel'
	| 'progress'
	| 'pause'
	| 'resume'
	| 'interrupt'
	| 'sleep'
	| 'wait'
	| 'duration';
//	| 'throttle';


// Types for a Promise's `resolve` and `reject` function
type ResolveFunc<T> = (value: T) => void;
type RejectFunc = (value: any) => void;
type NoblType<T> = Iterator<void, T>;

class NoblCancelledError extends Error {};

class NoblOperation<T> {
	_iterator: NoblType<T>;
	_resolve: ResolveFunc<T>;
	_reject: RejectFunc;
	
	constructor(
		iterator: NoblType<T>,
		resolve: ResolveFunc<T>,
		reject: RejectFunc,
	) {
		this._iterator = iterator;
		this._resolve = resolve;
		this._reject = reject;
	}
}

class Nobl {
	#duration = 20;
	// #throttle = 0.5;
	// #workDuration = 10;
	// #idleDuration = 10;

	#inside = false;
	#interrupted = false;
	#running = false;
	#paused = false;
	#sleeping = false;

	#operation?: NoblOperation<any>;
	#waitPromise?: Promise<void>;
	#listeners: Record<string, Set<NoblListener>> = {};
	
	// constructor() {
	// 	this.#updateDurations();
	// }

	// to-do: test duration setter and getter
	get duration(): number {
		return this.#duration;
	}
	set duration(n: number) {
		if (this.#inside /* && this.#operation */) {
			// Can't be inside an operation if there isn't one
			this.interrupt();
		}
		if (this.#duration !== n) {
			this.#duration = n;
			// this.#updateDurations();
			this.#dispatchEvent('duration');
		}
	}

	// to-do: consider adding throttling back in
	// get throttle(): number {
	// 	return this.#throttle;
	// }
	// set throttle(n: number) {
	// 	n = Math.max(0, Math.min(n, 1));
	// 	if (this.#throttle !== n) {
	// 		this.#throttle = n;
	// 		this.#updateDurations();
	// 		this.#dispatchEvent('throttle');
	// 	}
	// }

	get running(): boolean {
		return this.#running;
	}

	get paused(): boolean {
		return this.#paused;
	}

	get waiting(): boolean {
		return !!this.#waitPromise;
	}

	get sleeping(): boolean {
		return this.#sleeping;
	}

	// #updateDurations() {
	// 	if (this.#operation) {
	// 		this.#workDuration = this.#duration * this.#throttle;
	// 		this.#idleDuration = this.#duration - this.#workDuration;
	// 	}
	// }

	run<T>(arg: (NoblType<T>) | (() => NoblType<T>)): Promise<T> {
		this.#onlyIfNotRunning('run');
		this.#running = true;
		const iterator: NoblType<T> = (typeof arg === 'function') ? arg() : arg;
		return new Promise<T>((resolve, reject) => {
			this.#dispatchEvent('progress');
			this.#operation = new NoblOperation<T>(
				iterator,
				resolve,
				reject
			);
			this.#clump();
		}).finally(() => {
			this.#running = false;
		});
	}

	cancel() {
		this.#onlyFromOutside('cancel');
		const operation = this.#operation;
		this.#reset();
		if (operation) {
			this.#dispatchEvent('cancel');
			// Canceling has to reject, because it prevents the function from returning.
			operation._reject(new NoblCancelledError('operation cancelled'));
		}
	}

	#reset() {
		this.#inside = false;
		this.#interrupted = false;
		this.#operation = undefined;
		// this.#paused = false; <-- can cancel and stay paused
		this.#sleeping = false;
		this.#waitPromise = undefined;
	}

	next() {
		this.#onlyFromOutside('next');
		this.#onlyIfRunning('next');
		this.#onlyIfPaused('next');
		if (this.#waitPromise) {
			throw new Error(`can't next() while waiting`);
		}
		this.#step();
		this.#dispatchEvent('progress');
	}

	pause() {
		this.#onlyFromOutside('pause');
		// this.#onlyIfNotPaused('pause'); <-- not an error, just don't pause if paused
		if (!this.#paused) {
			this.#paused = true;
			this.#dispatchEvent('pause');
		}
	}

	resume() {
		this.#onlyFromOutside('resume');
		// this.#onlyIfPaused('resume'); <-- not an error, just don't resume if not paused
		if (this.#paused) {
			this.#paused = false;
			if (this.#operation) {
				this.#dispatchEvent('resume');
				this.#clump();
			}
		}
	}

	// to-do: test interrupt
	interrupt() {
		this.#onlyFromInside('interrupt');
		// this.#onlyIfRunning('interrupt'); <-- if it's not running, we're not inside
		this.#interrupted = true;
		this.#dispatchEvent('interrupt');
	}

	sleep(delay: number) {
		this.#onlyFromInside('sleep');
		// this.#onlyIfNotWaiting('sleep'); <-- if waiting, we're not inside
		// this.#onlyIfRunning('sleep'); <-- if not running, we're not inside
		this.#sleeping = true;
		this.#dispatchEvent('sleep');
		this.wait(
			new Promise<void>(resolve =>
				setTimeout(() => {
					this.#sleeping = false;
					resolve();
				}, delay)
			)
		);
	}

	wait(promise: Promise<void>) {
		this.#onlyFromInside('wait');
		// this.#onlyIfNotWaiting('sleep'); <-- if waiting, we're not inside
		// this.#onlyIfRunning('sleep'); <-- if not running, we're not inside
		this.#waitPromise = promise;
		this.#dispatchEvent('wait');
	}

	addListener(type: NoblEventType, listener: NoblListener) {
		if (!(type in this.#listeners)) {
			this.#listeners[type] = new Set();
		}
		this.#listeners[type].add(listener);
	}

	removeListener(type: NoblEventType, listener: NoblListener) {
		if (type in this.#listeners) {
			this.#listeners[type].delete(listener);
		}
	}

	#dispatchEvent(type: NoblEventType) {
		if (type in this.#listeners) {
			for (let listener of this.#listeners[type]) {
				listener({ type, nobl: this });
			}
		}
	}

	// Do a single iteration
	#step() {
		// if (!this.#operation) {
		//   // This error should never be thrown,
		//   // because #step should never be called when #operation is undefined.
		//   throw 'weird';
		// }
		if (this.#operation) {
			try {
				this.#inside = true;
				const item = this.#operation._iterator.next();
				if (item.done) {
					const {_resolve} = this.#operation;
					this.#operation = undefined;
					_resolve(item.value);
				}
			} catch (e) {
				if (!this.#operation) {
					throw e;
				}
				const {_reject} = this.#operation;
				// 			this.#operation = undefined;
				this.#reset();
				_reject(e);
			} finally {
				this.#inside = false;
			}
		}
	}

	#clump() {
		setTimeout(() => {
			const end = performance.now() + this.#duration; // this.#workDuration;
			while (
				!this.#interrupted &&
				!this.#paused &&
				!this.#waitPromise &&
				this.#operation &&
				performance.now() < end
			) {
				this.#step();
			}

			this.#dispatchEvent('progress');

			this.#interrupted = false;

			if (this.#waitPromise) {
				const promise = this.#waitPromise;
				promise.then(() => {
					// Only do the next clump if the operation wasn't cancelled
					// while waiting for the promise.
					if (this.#waitPromise === promise) {
						this.#waitPromise = undefined;
						this.#clump();
					}
				});
				return;
			}

			if (this.#operation && !this.#paused) {
				this.#clump(); // The timeout happens at the beginning of the clump now
			}

		}, 0 /* this.#idleDuration */);
	}

	#onlyIfRunning(method: string) {
		if (!this.#operation) {
			onlyWhen(method, 'when running');
		}
	}

	#onlyIfNotRunning(method: string) {
		if (this.#operation) {
			onlyWhen(method, 'when not running');
		}
	}

	#onlyIfPaused(method: string) {
		if (!this.#paused) {
			onlyWhen(method, 'when paused');
		}
	}

	#onlyFromInside(method: string) {
		if (!this.#inside) {
			onlyWhen(method, 'inside the operation');
		}
	}

	#onlyFromOutside(method: string) {
		if (this.#inside) {
			onlyWhen(method, 'outside the operation');
		}
	}
}

const onlyWhen = (method: string, when: string) => {
	throw new Error(method + ' can only be called ' + when);
};

export {Nobl, NoblCancelledError, NoblType};
