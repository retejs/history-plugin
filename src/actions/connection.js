import Action from '../action';

function reassign(connection) {
    const { input, output } = connection;

    return output.connections.find(c => c.input === input);
}

export class AddConnectionAction extends Action {
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

export class RemoveConnectionAction extends Action {
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
