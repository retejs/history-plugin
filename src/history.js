export default class History {
    constructor({ limit }) {
        this.active = false;
        this.produced = [];
        this.reserved = [];
        if (limit && typeof this.limit === 'number') this.limit = limit;
    }

    add(action) {
        if (this.active) return;
        this.produced.push(action);
        if (this.produced.length > this.limit) this.produced.shift();
        this.reserved = [];
    }

    get last() {
        return this.produced[this.produced.length - 1];
    }

    _do(from, to, type) {
        const action = from.pop();

        if (!action) return;

        this.active = true;
        action[type]();
        to.push(action);
        this.active = false;
    }

    undo() {
        this._do(this.produced, this.reserved, 'undo');
    }

    clear() {
        this.active = false;
        this.produced = [];
        this.reserved = [];
    }

    redo() {
        this._do(this.reserved, this.produced, 'redo');
    }
}
