/**
 * Base interface for all actions
 * @example export class CustomAction<S extends BaseSchemes> implements HistoryAction {
  async undo() {
    // undo logic
  }
  async redo() {
    // redo logic
  }
}
 */
export interface Action {
  undo(): void | Promise<void>
  redo(): void | Promise<void>
}
