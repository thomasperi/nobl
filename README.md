# Nobl
* <ins>No</ins>n-<ins>bl</ins>ocking loops
* "knobble" / "noble" / "no bull"

Nobl lets you write long-running operations that run asynchronously instead of blocking the thread, by automatically ceding control back to the browser ragularly throughout each operation (every 20ms by default).

Pass a [generator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function*) to `nobl.start`, and it returns a Promise that resolves when the function returns. Every `yield` statement in the generator function marks where the operation can periodically cede control to the browser.

```javascript
import { Nobl } from 'nobl';
let nobl = new Nobl();
nobl.start(function* () {
  for (let i = 1; i <= 1e10; i++) {
    if (i % 1e7 === i) {
      console.log(i);
    }
    yield;
  }
});
```

## Caveat
Nobl is experimental and hasn't seen much real-world use. You probably shouldn't rely on it for mission-critical applications.

## License
MIT
