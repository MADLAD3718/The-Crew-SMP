import { Container } from "@minecraft/server";

Container.prototype.findIndex = function (predicate) {
    for (let i = 0; i < this.size; ++i) {
        const item = this.getItem(i);
        if (predicate(item)) return i;
    }
    return -1;
}

Container.prototype.findItem = function (predicate) {
    for (let i = 0; i < this.size; ++i) {
        const item = this.getItem(i);
        if (predicate(item)) return item;
    }
    return undefined;
}
