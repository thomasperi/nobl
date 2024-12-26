interface Operation {
	iterator: Iterator<any>;
	resolve: Function;
	reject: Function;
}

export class NoblCancelled extends Error {
	constructor() {
		super('operation cancelled');
	}
}

export interface NoblEvent {
	type: NoblEventType;
	nobl: Nobl;
}

export type NoblListener = (event: NoblEvent) => Promise<void> | void;

export type NoblEventType =
	| 'cancel'
	| 'progress'
	| 'pause'
	| 'resume'
	| 'interrupt'
	| 'sleep'
	| 'wait'
	| 'duration'
	| 'throttle';

export class Nobl {
	#duration = 20;
	#workDuration = 5;
	#idleDuration = 5;
	#throttle = 0.5;

	#inside = false;
	#interrupted = false;
	#operation?: Operation;
	#doing = false;
	#paused = false;
	#sleeping = false;
	#waitPromise?: Promise<void>;
	#listeners: Record<string, Set<NoblListener>> = {};

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
			this.#updateDurations();
			this.#dispatchEvent('duration');
		}
	}

	// to-do: test throttle
	get throttle(): number {
		return this.#throttle;
	}
	set throttle(n: number) {
		n = Math.max(0, Math.min(n, 1));
		if (this.#throttle !== n) {
			this.#throttle = n;
			this.#updateDurations();
			this.#dispatchEvent('throttle');
		}
	}

	get doing(): boolean {
		return this.#doing;
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

	#updateDurations() {
		this.#workDuration = this.#duration * this.#throttle;
		this.#idleDuration = this.#duration - this.#workDuration;
	}

	do(generator: () => Iterator<any>, thisObj?: any): Promise<void> {
		this.#onlyIfNotRunning('do');
		this.#doing = true;
		return new Promise((resolve, reject) => {
			const progressPromise = this.#dispatchEvent('progress');
			this.#operation = {
				resolve,
				reject,
				iterator: generator.call(thisObj),
			};
			progressPromise.then(() => {
				this.#clump();
			});
		})
			.then((a: any) => a)
			.finally(() => {
				this.#doing = false;
			});
	}

	cancel() {
		this.#onlyFromOutside('cancel');
		const operation = this.#operation;
		this.#reset();
		if (operation) {
			this.#dispatchEvent('cancel');
			// Canceling has to reject, because it prevents the function from returning.
			operation.reject(new NoblCancelled());
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

	next(): Promise<void> {
		this.#onlyFromOutside('next');
		this.#onlyIfRunning('next');
		this.#onlyIfPaused('next');
		if (this.#waitPromise) {
			return this.#waitPromise;
		}
		this.#step();
		return this.#dispatchEvent('progress');
	}

	pause() {
		this.#onlyFromOutside('pause');
		// this.#onlyIfNotPaused('pause');
		this.#paused = true;
		this.#dispatchEvent('pause');
	}

	resume() {
		this.#onlyFromOutside('resume');
		// this.#onlyIfPaused('resume');
		if (this.#paused) {
			this.#paused = false;
			if (this.#operation) {
				this.#dispatchEvent('resume');
				this.#clump();
			}
		}
	}

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

	#dispatchEvent(type: NoblEventType): Promise<void> {
		if (type in this.#listeners) {
			return Promise.all(
				[...this.#listeners[type]].map(listener =>
					listener({
						type,
						nobl: this,
					})
				)
			).then(() => {});
		}
		return Promise.resolve();
	}

	// Do a single iteration
	#step() {
		if (!this.#operation) {
			// This error should never be thrown,
			// because #step should never be called when #operation is undefined.
			throw 'weird';
		}
		try {
			this.#inside = true;
			const item = this.#operation.iterator.next();
			if (item.done) {
				const {resolve} = this.#operation;
				this.#operation = undefined;
				resolve(item.value);
			}
		} catch (e) {
			if (!this.#operation) {
				throw e;
			}
			const {reject} = this.#operation;
			// 			this.#operation = undefined;
			this.#reset();
			reject(e);
		} finally {
			this.#inside = false;
		}
	}

	#clump() {
		setTimeout(() => {
			const end = performance.now() + this.#workDuration;
			while (
				!this.#interrupted &&
				!this.#paused &&
				!this.#waitPromise &&
				this.#operation &&
				performance.now() < end
			) {
				this.#step();
			}

			this.#dispatchEvent('progress').then(() => {
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
			});
		}, this.#idleDuration);
	}

	#onlyIfRunning(method: string) {
		if (!this.#operation) {
			throw new Error(
				`${method} cannot be called when there is no operation running.`
			);
		}
	}

	#onlyIfNotRunning(method: string) {
		if (this.#operation) {
			throw new Error(
				`${method} cannot be called when an operation is running.`
			);
		}
	}

	#onlyIfPaused(method: string) {
		if (!this.#paused) {
			throw new Error(
				`${method} can only be called when the operation is paused.`
			);
		}
	}

	#onlyIfNotPaused(method: string) {
		if (this.#paused) {
			throw new Error(
				`${method} cannot be called when the operation is paused.`
			);
		}
	}

	#onlyIfNotWaiting(method: string) {
		if (this.#waitPromise) {
			throw new Error(
				`${method} cannot be called while waiting for an existing promise. Did you forget a yield?`
			);
		}
	}

	#onlyFromInside(method: string) {
		if (!this.#inside) {
			throw new Error(`${method} can only be called from inside a generator`);
		}
	}

	#onlyFromOutside(method: string) {
		if (this.#inside) {
			throw new Error(`${method} cannot be called from inside a generator`);
		}
	}
}
