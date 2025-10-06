import { Container, ContainerSlot, ItemStack } from "@minecraft/server";

declare module "@minecraft/server" {
    interface Container {
        /**
         * Finds the first occurance of a container slot with an item
         * that satisfies the predicate.
         * @param pred A predicate to test each item on.
         */
        firstMatch(pred: (item: ItemStack) => boolean): ContainerSlot | undefined;
    }
    interface ContainerSlot {
        /**
         * Decrements the amount of items in this slot.
         */
        decrement(): void;
    }
}

Container.prototype.firstMatch = function (pred: (item: ItemStack) => boolean): ContainerSlot | undefined {
    for (let i = 0; i < this.size; ++i) {
        const slot = this.getSlot(i);
        if (!slot.hasItem()) continue;

        if (pred(slot.getItem() as ItemStack)) return slot;
    }
    return undefined;
}

ContainerSlot.prototype.decrement = function (): void {
    if (!this.hasItem()) return;
    if (this.amount > 1)
        this.amount--;
    else this.setItem();
}
