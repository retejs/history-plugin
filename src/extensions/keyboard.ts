import { BaseSchemes } from 'rete'

import { HistoryPlugin } from '..'

export function keyboard<Schemes extends BaseSchemes, K>(plugin: HistoryPlugin<Schemes, K>) {
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
    });
}
