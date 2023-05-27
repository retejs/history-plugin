import { BaseSchemes } from 'rete'

import { HistoryPlugin } from '..'
import { Action } from '../types'

export type Preset<S extends BaseSchemes, A extends Action> = {
  connect: (history: HistoryPlugin<S, A>) => void
}
