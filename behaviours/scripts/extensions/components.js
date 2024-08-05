import { ItemComponentTypes, ItemStack } from "@minecraft/server";

Object.defineProperties(ItemStack.prototype, {
    durability: {
        get() {
            return this.getComponent(ItemComponentTypes.Durability);
        }
    }
});
