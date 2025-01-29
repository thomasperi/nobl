# Nobl

Nobl lets you write long-running loops that run asynchronously instead of blocking the thread, by automatically ceding control back to the browser at regular intervals (every 20ms).

* <ins>No</ins>n-<ins>bl</ins>ocking loops
* "knobble" / "noble" / "no bull"

## Usage

Put `await nobl()` wherever you want the code to *potentially* cede control to the browser. It doesn't *necessarily* cede control every time. Only once every 20ms.

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

`nobl()` accepts as an optional argument an object with two optional properties:

Option     | Type
-----------|----------
`cancel`   | boolean
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

### `progress`

If the `progress` option is a function, it runs once every time control is ceded.

```javascript
import { nobl } from 'nobl';

function progress() {
  // Update a progress bar or something
}

async function longOperation() {
  for (let i = 0; i < hugeNumber; i++) {
    if (someCondition(i)) {
      smallPieceOfTheOperation(i);
    }
    await nobl({progress});
  }
}
```

## Caveat
Nobl is experimental and hasn't seen much real-world use. You probably shouldn't rely on it for mission-critical applications.

## License
MIT
