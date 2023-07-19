import { BaseSchemes, ConnectionId, NodeEditor, NodeId } from 'rete'
import { BaseArea, BaseAreaPlugin } from 'rete-area-plugin'

import { HistoryPlugin } from '../..'
import { Action } from '../../types'
import { Preset } from '../types'
import { AddConnectionAction, RemoveConnectionAction } from './actions/connection'
import { AddNodeAction, DragNodeAction, Position, RemoveNodeAction } from './actions/node'

type NodeActions<S extends BaseSchemes> =
  | AddNodeAction<S>
  | RemoveNodeAction<S>
  | DragNodeAction<S>

type ConnectionActions<S extends BaseSchemes> =
  | AddConnectionAction<S>
  | RemoveConnectionAction<S>

export type HistoryActions<S extends BaseSchemes> = NodeActions<S> | ConnectionActions<S>

function trackNodes<S extends BaseSchemes>(history: HistoryPlugin<S, NodeActions<S> | Action>, props: { timing: number }) {
  const nodes = new Map<NodeId, BaseSchemes['Node']>()
  const positions = new Map<NodeId, Position>()
  const area = history.parentScope<BaseAreaPlugin<S, BaseArea<S>>>(BaseAreaPlugin)
  const editor = area.parentScope<NodeEditor<S>>(NodeEditor)
  const timing = props.timing

  // eslint-disable-next-line max-statements
  editor.addPipe(context => {
    if (context.type === 'nodecreated') {
      const { id } = context.data

      history.add(new AddNodeAction<S>(editor, area, id))
      nodes.set(id, editor.getNode(context.data.id))
    }
    if (context.type === 'noderemoved') {
      const { id } = context.data
      const node = nodes.get(id)
      const position = positions.get(id)

      if (!node) throw new Error('node')
      if (!position) throw new Error('position' + id)
      history.add(new RemoveNodeAction<S>(editor, area, node, position))

      positions.delete(id)
      nodes.delete(id)
    }
    return context
  })
  area.addPipe(context => {
    if (!('type' in context)) return context

    if (context.type === 'nodetranslated') {
      const { id, position } = context.data

      positions.set(id, position)
    }
    return context
  })

  const picked: string[] = []

  // eslint-disable-next-line max-statements
  area.addPipe(context => {
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
      const recent = history.getRecent(timing)
        .filter((n): n is ({ time: number, action: DragNodeAction<S> }) => n.action instanceof DragNodeAction)
        .filter(n => n.action.nodeId === id)

      if (recent.length > 1) throw new Error('> 1')

      if (recent[0]) {
        recent[0].action.new = position
        recent[0].time = Date.now()
      } else {
        history.add(new DragNodeAction<S>(area, id, previous))
      }
    }

    return context
  })
}

function trackConnections<S extends BaseSchemes>(history: HistoryPlugin<S, ConnectionActions<S> | Action>) {
  const connections = new Map<ConnectionId, S['Connection']>()
  const editor = history.parentScope().parentScope<NodeEditor<S>>(NodeEditor)

  editor.addPipe(context => {
    if (context.type === 'connectioncreated') {
      const connection = editor.getConnection(context.data.id)

      history.add(new AddConnectionAction<S>(editor, connection))
      connections.set(context.data.id, connection)
    }
    if (context.type === 'connectionremoved') {
      const connection = connections.get(context.data.id)

      if (connection) {
        history.add(new RemoveConnectionAction<S>(editor, connection))
      }
    }

    return context
  })
}

/**
 * Classic preset for the history plugin. Tracks node adding/removing/translating, connection adding/removing.
 */
export function setup<S extends BaseSchemes>(props?: { timing?: number }): Preset<S, HistoryActions<S>> {
  return {
    connect(history) {
      const timing = props?.timing ?? (history.timing * 2)

      trackNodes(history, { timing })
      trackConnections(history)
    }
  }
}
