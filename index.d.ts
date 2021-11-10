import { Plugin as RetePlugin } from 'rete/types/core/plugin';
import {NodeEditor} from 'rete';

export interface HistoryPlugin extends RetePlugin {
  install: (editor: NodeEditor, options: {
    keyboard?: boolean, // use ctrl-z and ctrl-y for undo/redo, default true
  }) => void,
}

export class Action {
  undo: () => any
  redo: () => any
}


declare const _default: HistoryPlugin;
export default _default;