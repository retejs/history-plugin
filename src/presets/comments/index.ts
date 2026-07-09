import { CommentPlugin, FrameComment } from 'rete-comment-plugin'

import { HistoryPlugin } from '../..'
import { Preset } from '../types'
import {
  AddCommentAction,
  CommentSnapshot,
  DragCommentAction,
  EditCommentAction,
  RemoveCommentAction
} from './actions/comment'

export type { CommentSnapshot } from './actions/comment'
export {
  AddCommentAction,
  DragCommentAction,
  EditCommentAction,
  RemoveCommentAction
}

export type CommentHistoryActions =
  | AddCommentAction
  | RemoveCommentAction
  | DragCommentAction
  | EditCommentAction

function toSnapshot(data: { id: string, text: string, x: number, y: number, width: number, height: number, links: string[] }): CommentSnapshot {
  return {
    id: data.id,
    text: data.text,
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    links: [...data.links],
    kind: data instanceof FrameComment
      ? 'frame'
      : 'inline'
  }
}

function sameLinks(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index])
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
      history.add(new RemoveCommentAction(comment, toSnapshot(context.data)))
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
  comment: CommentPlugin<any, any>
) {
  comment.addPipe(context => {
    if (context.type !== 'commentdragged') return context

    const { id, previous, links } = context.data
    const item = comment.comments.get(id)

    if (!item) return context

    const moved = previous.x !== item.x || previous.y !== item.y
    const relinked = !sameLinks(links.prev, links.next)

    if (moved || relinked) {
      history.add(new DragCommentAction(
        comment,
        id,
        previous,
        { x: item.x, y: item.y },
        links.prev,
        links.next
      ))
    }

    return context
  })
}

/**
 * Comments preset for the history plugin. Tracks comment add/remove/drag/edit.
 */
export function setup(props: {
  comment: CommentPlugin<any, any>
}): Preset<any, CommentHistoryActions> {
  return {
    connect(history) {
      trackCreated(history, props.comment)
      trackRemoved(history, props.comment)
      trackEdited(history, props.comment)
      trackDragged(history, props.comment)
    }
  }
}
