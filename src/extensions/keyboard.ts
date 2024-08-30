import { BaseSchemes } from 'rete'

import { HistoryPlugin } from '..'
import { Action } from '../types'

/**
 * Adds keyboard shortcuts for history undo/redo
 * @param plugin History plugin instance
 */
export function keyboard<Schemes extends BaseSchemes, A extends Action>(plugin: HistoryPlugin<Schemes, A>) {
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey) return

    switch (e.code) {
      case 'KeyZ':
        void plugin.undo()
        break
      case 'KeyY':
        void plugin.redo()
        break
      default:
    }
  })
}
