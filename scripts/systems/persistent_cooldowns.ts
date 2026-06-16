import { world } from "@minecraft/server";

const CategoryList = new Set<string>();

world.beforeEvents.playerLeave.subscribe(({ player }) => {
    for (const category of CategoryList) {
        const cooldown = player.getItemCooldown(category);
        player.setDynamicProperty(`cooldown/${category}`, cooldown);
    }
});

world.afterEvents.playerSpawn.subscribe(event => {
    const { initialSpawn, player } = event;
    if (!initialSpawn) return;
    for (const id of player.getDynamicPropertyIds()) {
        const [type, category] = id.split('/');
        if (type != "cooldown") continue;

        const duration = player.getDynamicProperty(id) as number;
        player.startItemCooldown(category, duration);
    }
});

export namespace PersistentCooldowns {
    export function register(cooldownCategory: string): void {
        CategoryList.add(cooldownCategory);
    }
}
