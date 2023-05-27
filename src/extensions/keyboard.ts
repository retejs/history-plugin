import { BaseSchemes } from 'rete'

import { HistoryPlugin } from '..'
import { Action } from '../types'

export function keyboard<Schemes extends BaseSchemes, A extends Action>(plugin: HistoryPlugin<Schemes, A>) {
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey) return

    switch (e.code) {
    case 'KeyZ':
      plugin.undo()
      break
    case 'KeyY':
      plugin.redo()
      break
    default:
    }
  })
}
