import Action from './action'

type HistoryRecord = { time: number, action: Action }

export default class History {
  active = false
  produced: HistoryRecord[] = []
  reserved: HistoryRecord[] = []
  limit?: number

  constructor({ limit }: { limit?: number }) {
    if (limit && typeof limit === 'number') this.limit = limit
  }

  add(action: Action) {
    if (this.active) return
    this.produced.push({ time: Date.now(), action })
    if (this.limit && this.produced.length > this.limit) this.produced.shift()
    this.reserved = []
  }

  getRecent(ms: number) {
    const now = Date.now()
    const treshold = now - ms
    const list: HistoryRecord[] = []

    for (let i = this.produced.length - 1; this.produced[i] && this.produced[i].time > treshold; i--) {
      list.push(this.produced[i])
    }
    return list
  }

  async move(from: HistoryRecord[], to: HistoryRecord[], type: 'undo' | 'redo') {
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
