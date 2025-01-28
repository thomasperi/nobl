# Nobl

Nobl lets you write long-running loops that run asynchronously instead of blocking the thread, by automatically ceding control back to the browser at regular intervals (every 20ms) throughout each operation.

* <ins>No</ins>n-<ins>bl</ins>ocking loops
* "knobble" / "noble" / "no bull"

## Usage

Put `await nobl()` wherever you want the code to potentially cede control to the browser.

```javascript
import { nobl } from 'nobl';

async function longOperation() {
  for (let i = 0; i < hugeNumber; i++) {
    if (someCondition(i)) {
      smallPieceOfTheOperation(i);
    }
    await nobl(); // inside the loop, outside the `if` block
  }
}
```

## Options

`nobl()` accepts as an optional argument an object with two properties:

Option     | Type
-----------|----------
`cancel`   | boolean
`duration` | number
`sleep`    | number
`progress` | function

### `cancel`

If the `cancel` option is truthy, a `NoblCancelled` error is thrown.

```javascript
let cancel = false;
async function longOperation() {
  for (let i = 0; i < hugeNumber; i++) {
    // ...
    await nobl({cancel});
  }
}

setTimeout(() => {
  cancel = true;
}, 1000);

try {
  await longOperation();
} catch (e) {
  if (e instanceof NoblCancelled) {
  	// ...
  }
}
```

### `duration`

to-do: test and document `duration`


### `sleep`

If the `sleep` option is defined, `nobl` cedes control to the browser for `sleep` milliseconds.

You can specify a `sleep` of zero to force ceding control to the browser even if the thread hasn't been blocked for 20ms yet.

```javascript
async function longOperation() {
  for (let i = 1; i <= hugeNumber; i++) {
  	// do something special every 500 iterations
  	if (i % 500 === 0) {
  		updateProgressBarOrSomething();
  		await nobl({sleep: 0});
  	} else {
  		await nobl();
  	}
  }
}
```

### `progress`

to-do: document `progress`


## Caveat
Nobl is experimental and hasn't seen much real-world use. You probably shouldn't rely on it for mission-critical applications.

## License
MIT
