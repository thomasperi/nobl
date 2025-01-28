# Nobl

Nobl lets you write long-running loops that run asynchronously instead of blocking the thread, by automatically ceding control back to the browser regularly (every 20ms) throughout each operation.

* <ins>No</ins>n-<ins>bl</ins>ocking loops
* "knobble" / "noble" / "no bull"

## Usage

Pass a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function*) to the `nobl` function, and it returns a Promise that resolves when the function returns. Every `yield` statement in the generator function marks where the operation can periodically cede control to the browser.

```javascript
import { nobl } from 'nobl';

await nobl(function* () {
  for (let i = 0; i <= hugeNumber; i++) {
    if (someCondition(i)) {
      smallPieceOfTheOperation(i);
    }
    yield; // inside the loop, outside the `if` block
  }
});
```

## External Functions

It also accepts an iterator produced by calling a generator function, allowing you to concisely run existing generator functions that take arguments.

```javascript
function* hugeOperation(a, b) {
  // ...
}

await nobl(hugeOperation(foo, bar));
```

## Promises

Since generator functions can't be `async`, Nobl has a `wait` function to emulate `await` inside a generator function being `nobl`'d: `yield` the promise and pass the result to `wait`, which either returns the result or, if the promise rejected, throws the error.

```javascript
import { nobl, wait } from 'nobl';

await nobl(function* () {
  try {
    const res = wait(yield fetch('https://example.com/foo.json'));
    const json = res.ok && wait(yield res.json());
  } catch (e) {
    // ...
  }
});
```

## `AbortController` Awareness

`nobl` takes a second argument: an object with an optional `signal` property, which should be the `signal` property (an `AbortSignal`) of an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).

Aborting causes nobl to throw a `NoblAborted` error.

```javascript
import { nobl, NoblAborted } from 'nobl';

const ac = new AbortController();
const { signal } = ac;

setTimeout(() => {
  ac.cancel();
}, 1000);

try {
  await nobl(function* () {
    for (let i = 0; i <= hugeNumber; i++) {
      smallStep(i);
      yield;
    }
  }, { signal });
} catch (e) {
  if (e instanceof NoblAborted) {
    // ...
  }
}
```

## Caveat
Nobl is experimental and hasn't seen much real-world use. You probably shouldn't rely on it for mission-critical applications.

## License
MIT
