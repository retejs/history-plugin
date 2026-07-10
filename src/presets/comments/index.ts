import { BaseSchemes } from 'rete'
import { BaseAreaPlugin } from 'rete-area-plugin'
import { CommentPlugin, FrameComment, FrameMembership } from 'rete-comment-plugin'

import { HistoryPlugin } from '../..'
import { DragNodeAction } from '../classic/actions/node'
import { Preset } from '../types'
import {
  AddCommentAction,
  commentSnapshot,
  DragCommentAction,
  EditCommentAction,
  FrameState,
  NodeFrameMembershipAction,
  RemoveCommentAction
} from './actions/comment'

export type { CommentSnapshot, FrameState } from './actions/comment'
export {
  AddCommentAction,
  commentSnapshot,
  DragCommentAction,
  EditCommentAction,
  NodeFrameMembershipAction,
  RemoveCommentAction
}

export type CommentHistoryActions =
  | AddCommentAction
  | RemoveCommentAction
  | DragCommentAction
  | NodeFrameMembershipAction
  | EditCommentAction

function toFrameState(bounds: FrameMembership['previous'], links: string[]): FrameState {
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    links: [...links]
  }
}

type Position = { x: number, y: number }

function frameDragNodes(
  item: FrameComment,
  previous: Position,
  area: BaseAreaPlugin<BaseSchemes, any>
) {
  const dx = item.x - previous.x
  const dy = item.y - previous.y

  return item.links
    .map(id => {
      const view = area.nodeViews.get(id)

      if (!view) return null

      return {
        id,
        previous: { x: view.position.x - dx, y: view.position.y - dy },
        current: { ...view.position }
      }
    })
    .filter((node): node is { id: string, previous: Position, current: Position } => Boolean(node))
}

function absorbAllDragNodeActions(
  history: HistoryPlugin<any, CommentHistoryActions>,
  nodeId: string,
  timing: number
) {
  while (history.removeRecent(record => {
    const action = record.action

    return action instanceof DragNodeAction && action.nodeId === nodeId
  }, timing)) { /* remove recent classic drag actions for the same node */ }
}

function trackCreated(
  history: HistoryPlugin<any, CommentHistoryActions>,
  comment: CommentPlugin<any, any>
) {
  comment.addPipe(context => {
    if (context.type === 'commentcreated') {
      history.add(new AddCommentAction(comment, context.data.id))
    }
    return context
  })
}

function trackRemoved(
  history: HistoryPlugin<any, CommentHistoryActions>,
  comment: CommentPlugin<any, any>
) {
  comment.addPipe(context => {
    if (context.type === 'commentremoved') {
      history.add(new RemoveCommentAction(comment, commentSnapshot(context.data)))
    }
    return context
  })
}

function trackEdited(
  history: HistoryPlugin<any, CommentHistoryActions>,
  comment: CommentPlugin<any, any>
) {
  comment.addPipe(context => {
    if (context.type === 'commentedited') {
      const { comment: item, previousText } = context.data

      history.add(new EditCommentAction(comment, item.id, previousText, item.text))
    }
    return context
  })
}

function trackDragged(
  history: HistoryPlugin<any, CommentHistoryActions>,
  comment: CommentPlugin<any, any>,
  area: BaseAreaPlugin<BaseSchemes, any>
) {
  comment.addPipe(context => {
    if (context.type !== 'commentdragged') return context

    const { id, previous, prevLinks } = context.data
    const item = comment.comments.get(id)

    if (!item) return context

    const newLinks = [...item.links]
    const moved = previous.x !== item.x || previous.y !== item.y
    const relinked = prevLinks.length !== newLinks.length
      || prevLinks.some((linkId: string, index: number) => linkId !== newLinks[index])

    if (moved || relinked) {
      const nodes = item instanceof FrameComment
        ? frameDragNodes(item, previous, area)
        : []

      history.add(new DragCommentAction(
        comment,
        area,
        id,
        previous,
        { x: item.x, y: item.y },
        prevLinks,
        newLinks,
        nodes
      ))
    }

    return context
  })
}

function trackMembershipChanged(
  history: HistoryPlugin<any, CommentHistoryActions>,
  comment: CommentPlugin<any, any>,
  timing: number
) {
  comment.addPipe(context => {
    if (context.type !== 'commentmembershipchanged') return context

    const { node, frames } = context.data

    if (node) absorbAllDragNodeActions(history, node.id, timing)

    const nodeSnapshot = node
      ? { id: node.id, prev: node.previous, new: node.current }
      : null

    history.add(new NodeFrameMembershipAction(
      comment,
      frames.map((frame: FrameMembership) => ({
        id: frame.id,
        prev: toFrameState(frame.previous, frame.links.prev),
        next: toFrameState(frame.current, frame.links.next)
      })),
      nodeSnapshot
    ))

    return context
  })
}

/**
 * Comments preset for the history plugin. Tracks comment add/remove/drag/edit.
 *
 * Register together with `Presets.classic.setup()` so node drags that change frame
 * membership replace the classic `DragNodeAction` with `NodeFrameMembershipAction`.
 */
export function setup(props: {
  comment: CommentPlugin<any, any>
}): Preset<any, CommentHistoryActions> {
  return {
    connect(history) {
      const area = history.parentScope<BaseAreaPlugin<BaseSchemes, any>>(BaseAreaPlugin)
      const timing = history.timing * 2

      trackCreated(history, props.comment)
      trackRemoved(history, props.comment)
      trackEdited(history, props.comment)
      trackDragged(history, props.comment, area)
      trackMembershipChanged(history, props.comment, timing)
    }
  }
}
