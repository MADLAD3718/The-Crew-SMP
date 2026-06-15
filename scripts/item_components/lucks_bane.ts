import { EquipmentSlot, ItemCustomComponent, MolangVariableMap, system, world } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

world.afterEvents.entityHurt.subscribe(event => {
    const { damage, damageSource, hurtEntity } = event;
    if (!hurtEntity.isValid) return;

    const { damagingEntity } = damageSource, { dimension } = hurtEntity;
    const weapon = damagingEntity?.equipment?.getEquipmentSlot(EquipmentSlot.Mainhand);
    if (!weapon?.getItem()?.hasComponent("tcsmp:lucks_bane")) return;
    
    dimension.playSound("lucks_bane.coins", Vec3.above(hurtEntity.location));
    dimension.spawnParticle("tcsmp:lucks_bane_coin", Vec3.above(hurtEntity.location));

    const toEntity = Vec3.normalize(Vec3.sub(
        hurtEntity.getHeadLocation(),
        damagingEntity!.getHeadLocation()
    ));
    const target = Vec3.sub(hurtEntity.getHeadLocation(), toEntity);

    for (let i = 0; i < damage; i += 2) {
        system.runTimeout(() => {
            dimension.playSound("lucks_bane.big_hit", target);

            const molang = new MolangVariableMap();
            molang.setFloat("half", +(Math.floor(damage - i) == 1));
            dimension.spawnParticle("tcsmp:lucks_bane_heart", target, molang);
        }, i);
    }
});

const lucksBaneComponent: ItemCustomComponent = {};

export default lucksBaneComponent;
