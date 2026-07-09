import { BaseSchemes, NodeId } from 'rete'
import { BaseAreaPlugin } from 'rete-area-plugin'
import {
  Comment,
  CommentPlugin,
  CommentRestoreData,
  FrameBounds,
  FrameComment
} from 'rete-comment-plugin'

import { Action } from '../../../types'

export type CommentSnapshot = CommentRestoreData

export type FrameState = FrameBounds & { links: string[] }

type Position = { x: number, y: number }

type LinkedNodeSnapshot = { id: string, prev: Position, new: Position }

export function commentSnapshot(comment: Comment): CommentSnapshot {
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

    this.stored = commentSnapshot(item)
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
  private prevFrame?: FrameState
  private newFrame?: FrameState
  private nodes: LinkedNodeSnapshot[]

  constructor(
    private comment: CommentPlugin<any, any>,
    private area: BaseAreaPlugin<BaseSchemes, any>,
    public commentId: string,
    prev: Position,
    current: Position,
    prevLinks: string[],
    newLinks: string[],
    nodes?: { id: string, previous: Position, current: Position }[]
  ) {
    this.prev = { ...prev }
    this.new = { ...current }
    this.prevLinks = [...prevLinks]
    this.newLinks = [...newLinks]
    this.nodes = (nodes ?? []).map(({ id, previous, current: next }) => ({
      id,
      prev: { ...previous },
      new: { ...next }
    }))

    const item = comment.comments.get(commentId)

    // Frame drag changes position only; bounds stay until membership/resize elsewhere
    if (item instanceof FrameComment) {
      this.prevFrame = {
        x: prev.x,
        y: prev.y,
        width: item.width,
        height: item.height,
        links: [...prevLinks]
      }
      this.newFrame = {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        links: [...newLinks]
      }
    }
  }

  private async applyInline(position: Position, links: string[]) {
    const item = this.comment.comments.get(this.commentId)

    if (!item) return

    await this.comment.translate(this.commentId, position.x - item.x, position.y - item.y)
    await this.comment.setCommentLinks(this.commentId, links)
  }

  private async applyFrame(frame: FrameState, nodeTarget: 'prev' | 'new') {
    this.comment.setFrameState(this.commentId, frame)

    for (const node of this.nodes) {
      const position = nodeTarget === 'prev'
        ? node.prev
        : node.new
      const view = this.area.nodeViews.get(node.id)

      if (view) await view.translate(position.x, position.y)
    }
  }

  async undo() {
    if (this.prevFrame) {
      await this.applyFrame(this.prevFrame, 'prev')
      return
    }

    await this.applyInline(this.prev, this.prevLinks)
  }

  async redo() {
    if (this.newFrame) {
      await this.applyFrame(this.newFrame, 'new')
      return
    }

    await this.applyInline(this.new, this.newLinks)
  }
}

export class NodeFrameMembershipAction implements Action {
  constructor(
    private comment: CommentPlugin<any, any>,
    private frames: {
      id: string
      prev: FrameState
      next: FrameState
    }[],
    private node: { id: NodeId, prev: Position, new: Position } | null
  ) { }

  async undo() {
    await this.comment.restoreNodeFrameMembership({
      frames: this.frames.map(frame => ({ id: frame.id, state: frame.prev })),
      ...this.node
        ? { node: { id: this.node.id, position: this.node.prev } }
        : {}
    })
  }

  async redo() {
    await this.comment.restoreNodeFrameMembership({
      frames: this.frames.map(frame => ({ id: frame.id, state: frame.next })),
      ...this.node
        ? { node: { id: this.node.id, position: this.node.new } }
        : {}
    })
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
