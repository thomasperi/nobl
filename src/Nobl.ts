type NoblOptions = {
	cancel?: boolean;
	duration?: number;
	sleep?: number;
	progress?: () => any;
};

class NoblCancelled extends Error {};

const DURATION = 20;

let end = 0;

const nobl = (options: NoblOptions = {}): void | Promise<void> => {
	const { cancel, duration, sleep, progress } = options;
	const now = Date.now();
	if (cancel) {
		throw new NoblCancelled();
	}
	if (sleep !== undefined || ((now >= end) && (end = now + (duration || DURATION)))) {
		return new Promise(resolve => {
			if (progress) {
				progress();
			}
			setTimeout(resolve, sleep || 0);
		});
	}
};

export { nobl, NoblCancelled, NoblOptions };
