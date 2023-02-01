import { BaseSchemes, ConnectionId, NodeEditor, NodeId, Root, Scope } from 'rete'
import { Area2D, Area2DInherited, AreaPlugin } from 'rete-area-plugin'

import { AddConnectionAction, RemoveConnectionAction } from './actions/connection'
import { AddNodeAction, DragNodeAction, Position, RemoveNodeAction } from './actions/node'
import History from './history'

export * as HistoryExtensions from './extensions'

export class HistoryPlugin<Schemes extends BaseSchemes, K> extends Scope<never, Area2DInherited<Schemes, K>> {
    private history = new History({})
    private editor!: NodeEditor<Schemes>
    private area!: AreaPlugin<Schemes, K>

    constructor() {
        super('history')
    }

    setParent(scope: Scope<Area2D<Schemes>, [Root<Schemes>]>): void {
        super.setParent(scope)

        this.area = this.parentScope<AreaPlugin<Schemes, K>>(AreaPlugin)
        this.editor = this.area.parentScope<NodeEditor<Schemes>>(NodeEditor)

        this.trackNodes()
        this.trackConnections()

        this.editor.addPipe(context => {
            if (context.type === 'cleared') {
                this.history.clear()
            }
            return context
        })
    }

    private trackNodes() {
        const nodes = new Map<NodeId, BaseSchemes['Node']>()
        const positions = new Map<NodeId, Position>()

        // eslint-disable-next-line max-statements
        this.editor.addPipe(context => {
            if (context.type === 'nodecreated') {
                const { id } = context.data

                this.history.add(new AddNodeAction(this.editor, this.area, id))
                nodes.set(id, this.editor.getNode(context.data.id))
            }
            if (context.type === 'noderemoved') {
                const { id } = context.data
                const node = nodes.get(id)
                const position = positions.get(id)

                if (!node) throw new Error('node')
                if (!position) throw new Error('position' + id)
                this.history.add(new RemoveNodeAction(this.editor, this.area, node, position))

                positions.delete(id)
                nodes.delete(id)
            }
            return context
        })
        this.area.addPipe(context => {
            if (!('type' in context)) return context

            if (context.type === 'nodetranslated') {
                const { id, position } = context.data

                positions.set(id, position)
            }
            return context
        })

        const picked: string[] = []

        // eslint-disable-next-line max-statements
        this.area.addPipe(context => {
            if (!context || typeof context !== 'object' || !('type' in context)) return context

            if (context.type === 'nodepicked') {
                picked.push(context.data.id)
            }
            if (context.type === 'nodedragged') {
                const index = picked.indexOf(context.data.id)

                if (index >= 0) picked.splice(index, 1)
            }
            if (context.type === 'nodetranslated') {
                const { id, position, previous } = context.data
                const recent = this.history.getRecent(1000)
                    .map(n => n.action)
                    .filter((n): n is DragNodeAction<Schemes, any> => n instanceof DragNodeAction)
                    .filter(n => n.nodeId === id)

                if (recent.length > 1) throw new Error('> 1')

                if (recent[0]) {
                    recent[0].new = position
                } else {
                    this.history.add(new DragNodeAction(this.area, id, previous))
                }
            }

            return context
        })
    }

    private trackConnections() {
        const connections = new Map<ConnectionId, Schemes['Connection']>()

        this.editor.addPipe(context => {
            if (context.type === 'connectioncreated') {
                const connection = this.editor.getConnection(context.data.id)

                this.history.add(new AddConnectionAction(this.editor, connection))
                connections.set(context.data.id, connection)
            }
            if (context.type === 'connectionremoved') {
                const connection = connections.get(context.data.id)

                if (connection) {
                    this.history.add(new RemoveConnectionAction(this.editor, connection))
                }
            }

            return context
        })
    }

    public async undo(): Promise<void> {
        const record = await this.history.undo()

        if (record) {
            const latest = this.history.produced[this.history.produced.length - 1]

            if (latest && latest.time + 200 > record.time) await this.undo()

        }
    }

    public async redo(): Promise<void> {
        const record = await this.history.redo()

        if (record) {
            const latest = this.history.reserved[this.history.reserved.length - 1]

            if (latest && record.time + 200 > latest.time) await this.redo()
        }
    }
}
