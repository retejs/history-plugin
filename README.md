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
```