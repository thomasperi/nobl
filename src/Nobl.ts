export type ResolveFunc<T> = (value: T) => void;
export type RejectFunc = (value: any) => void;

export type NoblIterator<N, T> = Iterator<any | Promise<N>, T>;

export type NoblOperation<T> = {
	_iterator: NoblIterator<any, T>;
	_resolve: ResolveFunc<T>;
	_reject: RejectFunc;
};

class NoblCancelled extends Error {};

class Nobl {
	#duration = 20;
	
	#running = false;
	#reject?: RejectFunc;
	#yieldedPromise?: Promise<any>;
	#yieldedResult?: any;

	#finished() {
		this.#running = false;
		this.#reject = undefined;
		this.#yieldedPromise = undefined;
		this.#yieldedResult = undefined;
	}
	
	get running(): boolean {
		return this.#running;
	}

	run<T>(arg: (NoblIterator<any, T>) | (() => NoblIterator<any, T>)): Promise<T> {
		if (this.#running) {
			throw new Error('This Nobl instance is already running');
		}
		this.#running = true;
		const iterator = (typeof arg === 'function') ? arg() : arg;
		return new Promise<T>((resolve, reject) => {
			this.#reject = reject;
			this.#clump(iterator, resolve, reject);
		}).then((result: T)=> {
			this.#finished();
			return result;
		}).catch(e => {
			this.#finished();
			throw e;
		});
	}
	
	#clump<T>(iterator: NoblIterator<any, T>, resolve: ResolveFunc<T>, reject: RejectFunc) {
		setTimeout(() => {
			const end = performance.now() + this.#duration;
			do {
				try {
					const { done, value } = iterator.next(this.#yieldedResult);
					this.#yieldedResult = undefined; // clear it immediately after use
					if (done) {
						resolve(value);
					} else if (value instanceof Promise) {
						this.#yieldedPromise = value;
						break;
					} else {
						this.#yieldedResult = value;
					}
				} catch (e) {
					reject(e);
					break;
				}
			} while (performance.now() < end); // do...while allows at least one iteration per clump regardless of duration
			
			if (this.#running) {
				const yp = this.#yieldedPromise;
				if (yp) {
					yp.then((result: any) => {
						this.#yieldedResult = result;
						// Only do the next clump if the run wasn't cancelled
						// while waiting for the yielded promise to resolve.
						if (this.#yieldedPromise === yp) {
							this.#yieldedPromise = undefined;
							this.#clump(iterator, resolve, reject);
						}
					}).catch(reject);

				} else {
					this.#clump(iterator, resolve, reject);
				}
			}
		}, 0);
	}
	
	cancel() {
		if (this.#reject) {
			this.#reject(new NoblCancelled('operation cancelled'));
		}
	}

	interrupt(): Promise<void> {
		return this.sleep(0);
	}

	sleep(delay: number): Promise<void> {
		return new Promise<void>(resolve =>
			setTimeout(() => {
				resolve();
			}, delay)
		);
	}
}

export {Nobl, NoblCancelled};
