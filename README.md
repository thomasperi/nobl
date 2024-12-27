# Nobl
(<u>No</u>n-<u>bl</u>ocking loops)

Nobl lets you write long-running operations in a way that runs asynchronously instead of blocking the main thread, by automatically and frequently ceding control.

Pass a generator function to `nobl.start`, and it returns a Promise. Every `yield` statement encountered in the generator function serves as a possible breakpoint for the next timeout.

```javascript
import * from 'nobl';
const nobl = new Nobl();
await nobl.start(function* () {
	for (let x = 0; x < 1000; x++) {
		for (let y = 0; y < 1000; y++) {
			doSomeCraziness(x, y);
			yield;
		}
	}
});
```

Intuitively, the Promise resolves to the value returned from the generator function.

```javascript
let result = await nobl.start(function* () {
	let answer = 0;
	while (answer = somethingComplicated(answer)) {
		yield;
	}
	return answer;
});
console.log(`the answer: ${result}`);
```

An operation can be paused, resumed, and cancelled. Canceling causes a `NoblCancelled` error to be thrown.

```javascript
try {
	await nobl.start(function* () {
		while (somethingComplicated()) {
			yield;
		}
	})
} catch(e) {
	if (e instanceof NoblCancelled) {
		// ... snip: handle the cancellation ...
	} else {
		throw e;
	}
};
```

```html
<button onclick="nobl.pause()">Pause</button>
<button onclick="nobl.resume()">Resume</button>
<button onclick="nobl.cancel()">Cancel</button>
```

