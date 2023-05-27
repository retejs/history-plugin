import { Action } from './types'

export type HistoryRecord<A extends Action> = { time: number, action: A, separated?: boolean }

export default class History<A extends Action> {
  active = false
  produced: HistoryRecord<A>[] = []
  reserved: HistoryRecord<A>[] = []
  limit?: number

  constructor({ limit }: { limit?: number }) {
    if (limit && typeof limit === 'number') this.limit = limit
  }

  add(action: A) {
    if (this.active) return
    this.produced.push({ time: Date.now(), action })
    if (this.limit && this.produced.length > this.limit) this.produced.shift()
    this.reserved = []
  }

  getRecent(ms: number) {
    const now = Date.now()
    const treshold = now - ms
    const list: HistoryRecord<A>[] = []

    for (let i = this.produced.length - 1; i >= 0; i--) {
      const action = this.produced[i]

      if (action.time <= treshold) break
      if (action.separated) break

      list.push(action)
    }
    return list
  }

  async move(from: HistoryRecord<A>[], to: HistoryRecord<A>[], type: 'undo' | 'redo') {
    const record = from.pop()

    if (!record) return

    this.active = true
    await record.action[type]()
    to.push(record)
    this.active = false

    return record
  }

  async undo() {
    return await this.move(this.produced, this.reserved, 'undo')
  }

  clear() {
    this.active = false
    this.produced = []
    this.reserved = []
  }

  async redo() {
    return await this.move(this.reserved, this.produced, 'redo')
  }
}
