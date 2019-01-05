import Action from '../action';

export class AddNodeAction extends Action {
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

export class RemoveNodeAction extends Action {
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