import { Plugin as RetePlugin } from 'rete/types/core/plugin';
import {NodeEditor} from 'rete';

type InstallOptions = {
  keyboard?: boolean, // use ctrl-z and ctrl-y for undo/redo, default true
}
export interface HistoryPlugin extends RetePlugin {
  install: (editor: NodeEditor, options: InstallOptions) => void,
}

export class Action {
  undo: () => any
  redo: () => any
}


declare const _default: RetePlugin;
export default _default;