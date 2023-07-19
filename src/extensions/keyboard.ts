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

    /* eslint-disable indent */
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
