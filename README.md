# Nobl

Nobl lets you write long-running loops that run asynchronously instead of blocking the thread, by automatically ceding control back to the browser regularly throughout each operation (every 20ms by default).

* <ins>No</ins>n-<ins>bl</ins>ocking loops
* "knobble" / "noble" / "no bull"

## Usage

Pass a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function*) to `nobl.run`, and it returns a Promise that resolves when the function returns. Every `yield` statement in the generator function marks where the operation can periodically cede control to the browser.

```javascript
import { Nobl } from 'nobl';
let nobl = new Nobl();

await nobl.run(function* () {
  for (let i = 0; i <= hugeNumber; i++) {
    if (someCondition(i)) {
      smallPieceOfTheOperation(i);
    }
    yield; // inside the loop, outside the `if` block
  }
});
```

## External Functions

The `run` method also accepts the iterator produced by calling a generator function, allowing you to concisely run existing generator functions that take arguments.

```javascript
function* hugeOperation(a, b) {
  // ...
}

await nobl.run(hugeOperation(foo, bar));
```

## Caveat
Nobl is experimental and hasn't seen much real-world use. You probably shouldn't rely on it for mission-critical applications.

## License
MIT
