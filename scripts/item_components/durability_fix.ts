import { EquipmentSlot, GameMode, ItemCustomComponent, world } from "@minecraft/server";
import { MinecraftEnchantmentTypes } from "@minecraft/vanilla-data";

const BlockBreakCost: Record<string, number> = {
    "minecraft:is_axe": 1,
    "minecraft:is_pickaxe": 1,
    "minecraft:is_shovel": 1,
    "minecraft:is_hoe": 1,
    "minecraft:is_shears": 1,
    "minecraft:is_sword": 2,
    "minecraft:is_trident": 2
} as const;

const EntityAttackCost: Record<string, number> = {
    "minecraft:is_axe": 2,
    "minecraft:is_pickaxe": 2,
    "minecraft:is_shovel": 2,
    "minecraft:is_hoe": 2,
    "minecraft:is_shears": 0,
    "minecraft:is_sword": 1,
    "minecraft:is_trident": 1
} as const;

world.afterEvents.playerBreakBlock.subscribe(event => {
    const { itemStackBeforeBreak, player, dimension } = event;
    if (!itemStackBeforeBreak?.hasComponent("tcsmp:durability_fix")) return;
    if (player.getGameMode() == GameMode.Creative) return;

    const toolTag = itemStackBeforeBreak.getTags().find(tag => !!BlockBreakCost[tag]);
    const damage = toolTag ? BlockBreakCost[toolTag] : 2;
    const item = itemStackBeforeBreak.damage(damage);

    const slot = player.equipment.getEquipmentSlot(EquipmentSlot.Mainhand);
    slot.setItem(item);

    if (!item) dimension.playSound(
        "random.break",
        player.getHeadLocation(),
        { pitch: 0.9 }
    );
});

const durabilityFixComponent: ItemCustomComponent = {
    onBeforeDurabilityDamage(event) {
        const { itemStack, hitEntity } = event;
        const unbreaking = itemStack?.enchantable?.getEnchantment(MinecraftEnchantmentTypes.Unbreaking)?.level ?? 0;
        const toolTag = itemStack?.getTags().find(tag => !!BlockBreakCost[tag]);
        const damage = toolTag ? EntityAttackCost[toolTag] : 0;

        event.durabilityDamage = (Math.random() >= 1 / (unbreaking + 1) || hitEntity.isInvunerable) ? 0 : damage;
    }
}

export default durabilityFixComponent;
