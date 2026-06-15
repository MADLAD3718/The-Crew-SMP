import { ItemComponentTypes, ItemStack } from "@minecraft/server";
import { MinecraftEnchantmentTypes } from "@minecraft/vanilla-data";
import { MissingComponentError } from "../util";

declare module "@minecraft/server" {
    interface ItemStack {
        /**
         * Creates an exact copy of the item stack, including any
         * custom data or properties. Optionally replace the type
         * as well, given the new item type supports the same
         * components.
         *
         * @returns
         * Returns a copy of this item stack.
         * 
         * @throws
         * This function can throw errors.
         */
        clone(type?: string): ItemStack;
        /**
         * When present on an item, this item can take damage in the
         * process of being used. Note that this component only applies
         * to data-driven items.
         */
        readonly durability?: ItemDurabilityComponent;
        /**
         * When present on an item, this item can have enchantments applied to it.
         */
        readonly enchantable?: ItemEnchantableComponent;
        /**
         * Returns a clone of this itemstack with damaged durability.
         * 
         * @param amount The amount of durability damage to be dealt.
         * Defaults to: 1
         */
        damage(amount?: number): ItemStack | undefined;
    }
}

Object.defineProperties(ItemStack.prototype, {
    durability: {
        get() {
            return this.getComponent(ItemComponentTypes.Durability);
        }
    },
    enchantable: {
        get() {
            return this.getComponent(ItemComponentTypes.Enchantable);
        }
    }
});

ItemStack.prototype.clone = function (type?: string): ItemStack {
    const item = new ItemStack(type ?? this.type);
    item.amount = this.amount;
    item.nameTag = this.nameTag;
    item.lockMode = this.lockMode;
    item.keepOnDeath = this.keepOnDeath;

    if (this.durability) {
        if (!item.durability) throw new MissingComponentError(ItemComponentTypes.Durability);
        item.durability.damage = this.durability.damage;
    }

    if (this.enchantable) {
        if (!item.enchantable) throw new MissingComponentError(ItemComponentTypes.Enchantable);
        item.enchantable.addEnchantments(this.enchantable.getEnchantments());
    }
    
    return item;
}

ItemStack.prototype.damage = function (amount = 1): ItemStack | undefined {
    const item = this.clone();
    if (!item.durability) throw new MissingComponentError(ItemComponentTypes.Durability);

    const unbreaking = item.enchantable?.getEnchantment(MinecraftEnchantmentTypes.Unbreaking)?.level ?? 0;
    if (Math.random() > 1 / (unbreaking + 1)) return;

    if ((item.durability.damage + amount) > item.durability.maxDurability)
        return undefined;
    item.durability.damage += amount;
    return item;
}
