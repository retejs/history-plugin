export interface Action {
    undo(): void | Promise<void>
    redo(): void | Promise<void>
}
