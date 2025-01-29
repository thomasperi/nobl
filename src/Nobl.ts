type NoblOptions = {
	cancel?: boolean;
	progress?: () => any;
};

class NoblCancelled extends Error {};

const DURATION = 20;

let end = 0;

const nobl = (options: NoblOptions = {}): void | Promise<void> => {
	const { cancel, progress } = options;
	const now = Date.now();
	if (cancel) {
		throw new NoblCancelled();
	}
	if ((now >= end) && (end = now + DURATION)) {
		return new Promise(resolve => {
			if (typeof progress === 'function') {
				progress();
			}
			setTimeout(resolve, 0);
		});
	}
};

export { nobl, NoblCancelled, NoblOptions };
