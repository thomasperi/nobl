export type ResolveFunc<T> = (value: T) => void;
export type RejectFunc = (value: any) => void;

type NoblIterator<T> = Iterator<any, T>;

class NoblYielded {
	result: any;
	error: any;
	constructor(result: any, error: any) {
		this.result = result;
		this.error = error;
	}
};

type NoblOptions = {
	signal?: AbortSignal;
};

class NoblAborted extends Error {};

const CLUMP_DURATION = 20;

const nobl = <T>(arg: (NoblIterator<T>) | (() => NoblIterator<T>), options: NoblOptions = {}): Promise<T> => {
	let resolve!: ResolveFunc<T>;
	let reject!: RejectFunc;
	let yielded: any;
	let finished = false;
	let gotPromise = false;
	let end = 0;
	
	const { signal } = options;
	const iterator = (typeof arg === 'function') ? arg() : arg;
	
	const clump = () => {
		setTimeout(() => {
			end = Date.now() + CLUMP_DURATION;
			gotPromise = false;
			do {
				try {
					const { done, value } = iterator.next(yielded);
					if (done) {
						resolve(value);
					} else {
						yielded = value;
						gotPromise = yielded instanceof Promise;
					}
				} catch (e) {
					reject(e);
				}
			} while (!gotPromise && !finished && Date.now() < end);
	
			if (gotPromise) {
				yielded.then((result: any) => {
					yielded = new NoblYielded(result, null);
					clump();
				}).catch((error: any) => {
					yielded = new NoblYielded(null, error);
					clump();
				});
			} else {
				clump();
			}
		}, 0);
	};
	
	const abort = () => {
		reject(new NoblAborted('operation cancelled'));
	};
	
	if (signal) {
		signal.addEventListener('abort', abort, { once: true });
	}
	
	return new Promise<T>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
		clump();
	}).finally(() => {
		finished = true;
		if (signal) {
			signal.removeEventListener('abort', abort);
		}
	});
};

const wait = (yielded: any): any => {
	if (yielded instanceof NoblYielded) {
		const {result, error} = yielded;
		if (error) {
			throw error;
		}
		return result;
	} else {
		return yielded;
	}
};

export { nobl, wait, NoblAborted };
