import Action from '../action';

class NodeAction extends Action {
    constructor(editor, node) {
        super();
        this.editor = editor;
        this.node = node;
    }
}

export class AddNodeAction extends NodeAction {
    undo() {
        this.editor.removeNode(this.node);
    }
    redo() {
        this.editor.addNode(this.node);
    }
}

export class RemoveNodeAction extends NodeAction {
    undo() {
        this.editor.addNode(this.node);
    }
    redo() {
        this.editor.removeNode(this.node);
    }
}