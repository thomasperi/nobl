# Nobl
* <ins>No</ins>n-<ins>bl</ins>ocking loops
* "knobble" / "noble" / "no bull"

Nobl lets you write long-running operations that run asynchronously instead of blocking the thread, by automatically ceding control back to the browser regularly throughout each operation (every 20ms by default).

## Usage

Pass a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function*) to `nobl.run`, and it returns a Promise that resolves when the function returns. Every `yield` statement in the generator function marks where the operation can periodically cede control to the browser.

```javascript
import { Nobl } from 'nobl';
let nobl = new Nobl();

await nobl.run(function* () {
  for (let i = 1; i <= 1e10; i++) {
    if (i % 1e7 === 0) {
      console.log(i);
    }
    yield; // provide a potential breakpoint after every iteration
  }
});
```

## External Functions

The `run` method also accepts the iterator produced by calling a generator function, allowing you to call existing generator functions with arguments.

```javascript
function* longOperation(a, b) {
  // ...
}

await nobl.run(longOperation(foo, bar));
```

## Caveat
Nobl is experimental and hasn't seen much real-world use. You probably shouldn't rely on it for mission-critical applications.

## License
MIT
