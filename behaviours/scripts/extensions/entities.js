import { Entity, EntityEquippableComponent, EntityHealthComponent, EntityInventoryComponent, Player } from "@minecraft/server";

Object.defineProperties(Entity.prototype, {
    health: {
        get() {
            return this.getComponent(EntityHealthComponent.componentId)?.currentValue;
        },
        set(v) {
            this.getComponent(EntityHealthComponent.componentId)?.setCurrentValue(v);
        }
    },
    maxHealth: {
        get() {
            return this.getComponent(EntityHealthComponent.componentId)?.effectiveMax;
        }
    },
    inventory: {
        get() {
            return this.getComponent(EntityInventoryComponent.componentId);
        }
    },
    equipment: {
        get() {
            return this.getComponent(EntityEquippableComponent.componentId);
        }
    }
});

Player.prototype.applyImpulse = function (vector) {
    const {x, y, z} = vector;
    this.applyKnockback(x, z, Math.hypot(x, z), y);
}

Player.prototype.stopSound = function (sound = "") {
    this.runCommand("stopsound @s " + sound);
}
