import "@minecraft/server";

declare module "@minecraft/server" {
    interface ItemStack {
        /** The durability component of the itemstack. */
        readonly durability?: ItemDurabilityComponent;
    }
}
