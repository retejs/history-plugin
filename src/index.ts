import { BaseSchemes, NodeEditor, Root, Scope } from 'rete'
import { BaseArea, BaseAreaPlugin } from 'rete-area-plugin'

import History from './history'
import { Preset } from './presets/types'
import type { Action } from './types'

export type { Action as HistoryAction }
export * as HistoryExtensions from './extensions'
export * as Presets from './presets'
export type { HistoryActions } from './presets/classic'
export type { Preset } from './presets/types'

export class HistoryPlugin<Schemes extends BaseSchemes, A extends Action = Action> extends Scope<never, [BaseArea<Schemes>, Root<Schemes>]> {
  private history = new History<A>({})
  private editor!: NodeEditor<Schemes>
  private area!: BaseAreaPlugin<Schemes, BaseArea<Schemes>>

  private presets: Preset<Schemes, A>[] = []
  public timing: number

  constructor(props?: { timing?: number }) {
    super('history')

    this.timing = props?.timing ?? 200
  }

  setParent(scope: Scope<BaseArea<Schemes>, [Root<Schemes>]>): void {
    super.setParent(scope)

    this.area = this.parentScope<BaseAreaPlugin<Schemes, BaseArea<Schemes>>>(BaseAreaPlugin)
    this.editor = this.area.parentScope<NodeEditor<Schemes>>(NodeEditor)

    this.presets.forEach(preset => preset.connect(this))

    this.editor.addPipe(context => {
      if (context.type === 'cleared') {
        this.history.clear()
      }
      return context
    })
  }

  public addPreset<T extends A>(preset: Preset<Schemes, T>) {
    this.presets.push(preset as unknown as Preset<Schemes, A>)
    if (this.area && this.editor) (preset as unknown as Preset<Schemes, A>).connect(this)
  }

  public add(action: A) {
    this.history.add(action)
  }

  public getHistorySnapshot() {
    return [...this.history.produced]
  }

  public getRecent(ms: number) {
    return this.history.getRecent(ms)
  }

  public clear() {
    this.history.clear()
  }

  public separate() {
    const latest = this.history.produced[this.history.produced.length - 1]

    if (latest) latest.separated = true
  }

  public async undo(): Promise<void> {
    const record = await this.history.undo()

    if (record) {
      const latest = this.history.produced[this.history.produced.length - 1]

      if (latest && !latest.separated && latest.time + this.timing > record.time) {
        await this.undo()
      }
    }
  }

  public async redo(): Promise<void> {
    const record = await this.history.redo()

    if (record) {
      const latest = this.history.reserved[this.history.reserved.length - 1]

      if (latest && !record.separated && record.time + this.timing > latest.time) {
        await this.redo()
      }
    }
  }
}
