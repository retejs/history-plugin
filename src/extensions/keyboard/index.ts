import { BaseSchemes } from 'rete'

import { HistoryPlugin } from '../..'
import { Action } from '../../types'
import { isEditableElement } from './utils'

/**
 * Adds keyboard shortcuts for history undo/redo
 * @param plugin History plugin instance
 */
export function keyboard<Schemes extends BaseSchemes, A extends Action>(plugin: HistoryPlugin<Schemes, A>) {
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey) return

    // Don't trigger history actions if user is typing in an editable element
    if (isEditableElement(e.target)) return

    switch (e.code) {
      case 'KeyZ':
        void plugin.undo()
        e.preventDefault()
        break
      case 'KeyY':
        void plugin.redo()
        e.preventDefault()
        break
      default:
    }
  })
}
