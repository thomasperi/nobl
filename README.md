# Nobl
* <ins>No</ins>n-<ins>bl</ins>ocking loops
* "knobble" / "noble" / "no bull"

Nobl lets you write long-running operations in a way that runs asynchronously instead of blocking the main thread, by automatically ceding control back to the browser frequently throughout the operation.

## Experimental
Nobl is experimental and hasn't seen much real-world use, so it's best if you don't rely on it for mission-critical applications.

## Usage
Pass a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function*) to `nobl.start`, and it returns a Promise that resolves when the function returns. Every `yield` statement encountered in the generator function serves as a possible breakpoint for the next timeout.

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
  while (someCondition(answer)) {
    answer = somethingComplicated(answer);
    yield;
  }
  return answer;
});
console.log(`the answer: ${result}`);
```

An operation can be paused, resumed, and cancelled.

```javascript
// Canceling causes an error to be thrown, so we need to try...catch it.
try {
  await nobl.start(function* () {
    while (someCondition()) {
      smallPartOfSomethingBig();
      yield;
    }
  });
  doneWithTheLoop();
} catch(e) {
  if (e instanceof NoblCancelled) {
    handleTheCancellation();
  } else {
    throw e;
  }
};

// The pausing, resuming, and cancelling are triggered from outside the nobl operation.
// For example, when buttons are clicked:
document.querySelector('button.pause').addEventListener('click', () => nobl.pause());
document.querySelector('button.resume').addEventListener('click', () => nobl.resume());
document.querySelector('button.cancel').addEventListener('click', () => nobl.cancel());
```
