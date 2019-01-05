/*!
* rete-history-plugin v0.1.0 
* (c) 2019  
* Released under the ISC license.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.HistoryPlugin = factory());
}(this, (function () { 'use strict';

    class History {
        constructor() {
            this.active = false;
            this.produced = [];
            this.reserved = [];
        }

        add(action) {
            if (this.active) return;
            this.produced.push(action);
            this.reserved = [];
        }

        _do(from, to, type) {
            const action = from.pop();
            if (!action) return;

            this.active = true;
            action[type]();
            to.push(action);
            this.active = false;
        }

        undo() {
            this._do(this.produced, this.reserved, 'undo');
        }

        redo() {
            this._do(this.reserved, this.produced, 'redo');
        }
    }

    class Action {
        undo() {}
        redo() {}
    }

    class AddNodeAction extends Action {
        constructor(editor, node) {
            super();
            this.editor = editor;
            this.node = node;
        }
        undo() {
            this.editor.removeNode(this.node);
        }
        redo() {
            this.editor.addNode(this.node);
        }
    }

    class RemoveNodeAction extends Action {
        constructor(editor, node) {
            super();
            this.editor = editor;
            this.node = node;
        }
        undo() {
            this.editor.addNode(this.node);
        }
        redo() {
            this.editor.removeNode(this.node);
        }
    }

    function reassign(connection) {
        const { input, output } = connection;

        return output.connections.find(c => {
            return c.input === input;
        });
    }

    class AddConnectionAction extends Action {
        constructor(editor, connection) {
            super();
            this.editor = editor;
            this.connection = connection;
        }
        undo() {
            this.editor.removeConnection(this.connection);
        }
        redo() {
            this.editor.connect(this.connection.output, this.connection.input);
            this.connection = reassign(this.connection);
        }
    }

    class RemoveConnectionAction extends Action {
        constructor(editor, connection) {
            super();
            this.editor = editor;
            this.connection = connection;
        }
        undo() {
            this.editor.connect(output, input);
            this.connection = reassign(this.connection);
        }
        redo() {
            this.editor.removeConnection(this.connection);
        }
    }

    function install(editor, { keyboard = true }) {
        editor.bind('undo');
        editor.bind('redo');
        editor.bind('addhistory');

        const history = new History();

        editor.on('undo', () => {
            return history.undo();
        });
        editor.on('redo', () => {
            return history.redo();
        });
        editor.on('addhistory', action => {
            return history.add(action);
        });

        editor.on('nodecreated', node => {
            return history.add(new AddNodeAction(editor, node));
        });
        editor.on('noderemoved', node => {
            return history.add(new RemoveNodeAction(editor, node));
        });
        editor.on('connectioncreated', c => {
            return history.add(new AddConnectionAction(editor, c));
        });
        editor.on('connectionremoved', c => {
            return history.add(new RemoveConnectionAction(editor, c));
        });

        if (keyboard) document.addEventListener('keydown', e => {
            if (!e.ctrlKey) return;

            switch (e.code) {
                case 'KeyZ':
                    editor.trigger('undo');break;
                case 'KeyY':
                    editor.trigger('redo');break;
            }
        });
    }

    var index = {
        name: 'history',
        install,
        Action
    };

    return index;

})));
//# sourceMappingURL=history-plugin.debug.js.map
