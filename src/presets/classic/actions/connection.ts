import { BaseSchemes, NodeEditor } from 'rete'

import { Action } from '../../../types'

export class AddConnectionAction<S extends BaseSchemes> implements Action {
  constructor(private editor: NodeEditor<S>, private connection: S['Connection']) { }

  async undo() {
    await this.editor.removeConnection(this.connection.id)
  }

  async redo() {
    await this.editor.addConnection(this.connection)
  }
}

export class RemoveConnectionAction<S extends BaseSchemes> implements Action {
  constructor(private editor: NodeEditor<S>, private connection: S['Connection']) { }

  async undo() {
    await this.editor.addConnection(this.connection)
  }

  async redo() {
    await this.editor.removeConnection(this.connection.id)
  }
}
