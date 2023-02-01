export default interface Action {
    undo(): void | Promise<void>
    redo(): void | Promise<void>
}
