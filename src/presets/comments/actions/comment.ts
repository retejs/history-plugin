import { Comment, CommentPlugin, FrameComment } from 'rete-comment-plugin'

import { Action } from '../../../types'

export type CommentSnapshot = {
  id: string
  text: string
  x: number
  y: number
  width: number
  height: number
  links: string[]
  kind: 'inline' | 'frame'
}

type Position = { x: number, y: number }

function snapshot(comment: Comment): CommentSnapshot {
  return {
    id: comment.id,
    text: comment.text,
    x: comment.x,
    y: comment.y,
    width: comment.width,
    height: comment.height,
    links: [...comment.links],
    kind: comment instanceof FrameComment
      ? 'frame'
      : 'inline'
  }
}

export class AddCommentAction implements Action {
  private stored?: CommentSnapshot

  constructor(
    private comment: CommentPlugin<any, any>,
    private commentId: string
  ) { }

  undo() {
    const item = this.comment.comments.get(this.commentId)

    if (!item) return

    this.stored = snapshot(item)
    this.comment.delete(this.commentId)
  }

  redo() {
    if (!this.stored) return

    this.comment.restoreComment(this.stored)
  }
}

export class RemoveCommentAction implements Action {
  constructor(
    private comment: CommentPlugin<any, any>,
    private stored: CommentSnapshot
  ) { }

  undo() {
    this.comment.restoreComment(this.stored)
  }

  redo() {
    this.comment.delete(this.stored.id)
  }
}

export class DragCommentAction implements Action {
  prev: Position
  new: Position
  prevLinks: string[]
  newLinks: string[]

  constructor(
    private comment: CommentPlugin<any, any>,
    public commentId: string,
    prev: Position,
    current: Position,
    prevLinks: string[],
    newLinks: string[]
  ) {
    this.prev = { ...prev }
    this.new = { ...current }
    this.prevLinks = [...prevLinks]
    this.newLinks = [...newLinks]
  }

  private async moveTo(position: Position, links: string[]) {
    const item = this.comment.comments.get(this.commentId)

    if (!item) return

    await this.comment.translate(this.commentId, position.x - item.x, position.y - item.y)
    item.linkTo([...links])
  }

  async undo() {
    await this.moveTo(this.prev, this.prevLinks)
  }

  async redo() {
    await this.moveTo(this.new, this.newLinks)
  }
}

export class EditCommentAction implements Action {
  constructor(
    private comment: CommentPlugin<any, any>,
    private commentId: string,
    private previousText: string,
    private newText: string
  ) { }

  undo() {
    const item = this.comment.comments.get(this.commentId)

    if (!item) return

    item.text = this.previousText
    item.update()
  }

  redo() {
    const item = this.comment.comments.get(this.commentId)

    if (!item) return

    item.text = this.newText
    item.update()
  }
}
