History
====
#### Rete.js plugin

```js
import HistoryPlugin from 'rete-history-plugin';

editor.use(HistoryPlugin, { keyboard: true });
```

Handle history programmatically 
```js
editor.trigger('undo');
editor.trigger('redo');
```

Custom action
```js
import { Action } from 'rete-history-plugin';

export class YourAction extends Action {
    constructor() {
        super();
    }
    undo() {
        ///
    }
    redo() {
        ///
    }
}

editor.trigger('addhistory', new YourAction());
```


Example: add text field changes to history

```js
class FieldChangeAction extends HistoryPlugin.Action {
    constructor(prev, next, set) {
        super()
        this.prev = prev;
        this.next = next;
        this.set = set;
    }
    undo() {
        this.set(this.prev);
    }
    redo() {
        this.set(this.next);
    }
}

// inside a "change" method of your Control (called by user action)
// this.value - value before changing
// next - new value
// (v) => this.set(v) - change value of Field by undo/redo
this.emitter.trigger('addhistory', new FieldChangeAction(this.value, next, (v) => this.set(v)));
```
