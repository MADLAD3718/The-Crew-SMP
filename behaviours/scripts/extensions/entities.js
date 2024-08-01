import { Entity, EntityEquippableComponent, EntityHealthComponent, EntityInventoryComponent } from "@minecraft/server";

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
