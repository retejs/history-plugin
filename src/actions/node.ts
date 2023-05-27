import { BaseSchemes, NodeEditor, NodeId } from 'rete'
import { AreaPlugin } from 'rete-area-plugin'

import Action from '../action'

export type Position = { x: number, y: number }

export class AddNodeAction<S extends BaseSchemes, K> implements Action {
  node?: S['Node']
  position?: Position

  constructor(private editor: NodeEditor<S>, private area: AreaPlugin<S, K>, private nodeId: NodeId) { }

  async undo() {
    this.node = this.editor.getNode(this.nodeId)
    this.position = this.area.nodeViews.get(this.nodeId)?.position
    await this.editor.removeNode(this.nodeId)
  }

  async redo() {
    if (this.node) await this.editor.addNode(this.node)
    if (this.node && this.position) await this.area.translate(this.node.id, this.position)
  }
}

export class RemoveNodeAction<S extends BaseSchemes, K> implements Action {
  constructor(
    private editor: NodeEditor<S>,
    private area: AreaPlugin<S, K>,
    private node: S['Node'],
    private position: Position
  ) { }

  async undo() {
    await this.editor.addNode(this.node)
    await this.area.translate(this.node.id, this.position)
  }

  async redo() {
    await this.editor.removeNode(this.node.id)
  }
}

export class DragNodeAction<S extends BaseSchemes, K> implements Action {
  prev!: Position
  new!: Position

  constructor(private area: AreaPlugin<S, K>, public nodeId: NodeId, prev: Position) {
    const view = area.nodeViews.get(nodeId)

    if (!view) return

    this.prev = { ...prev }
    this.new = { ...view.position }
  }

  async translate(position: Position) {
    const view = this.area.nodeViews.get(this.nodeId)

    if (!view) return

    await view.translate(position.x, position.y)
  }

  async undo() {
    await this.translate(this.prev)
  }

  async redo() {
    await this.translate(this.new)
  }
}
