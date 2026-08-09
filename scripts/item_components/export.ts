import { ItemCustomComponent } from "@minecraft/server";
import autoLoreComponent from "./auto_lore";
import backstabComponent from "./backstab";
import decaySpellComponent from "./decay_spell";
import durabilityFixComponent from "./durability_fix";
import gerbilComponent from "./gerbil";
import globalCooldownComponent from "./global_cooldown";
import grapplingHookComponent from "./grappling_hook";
import growthSpellComponent from "./growth_spell";
import katanaComponent from "./katana";
import lucksBaneComponent from "./lucks_bane";
import nauseaSpellComponent from "./nausea_spell";
import randomEffectOnHitComponent from "./random_effect_on_hit";
import randomExpDamageComponent from "./random_exp_damage";
import returnSpellComponent from "./return_spell";
import spellScrollComponent from "./spell_scroll";
import thunderSpellComponent from "./thunder_spell";
import undeadSpellComponent from "./undead_spell";
import "./tnt_shield";

type ItemComponentRegister = {
    name: string
    component: ItemCustomComponent
}

/** An array containing all custom item components. */
const ItemComponents: ItemComponentRegister[] = [
    {
        name: "tcsmp:spell_scroll",
        component: spellScrollComponent
    },
    {
        name: "tcsmp:return_spell",
        component: returnSpellComponent
    },
    {
        name: "tcsmp:thunder_spell",
        component: thunderSpellComponent
    },
    {
        name: "tcsmp:growth_spell",
        component: growthSpellComponent
    },
    {
        name: "tcsmp:decay_spell",
        component: decaySpellComponent
    },
    {
        name: "tcsmp:grappling_hook",
        component: grapplingHookComponent
    },
    {
        name: "tcsmp:katana",
        component: katanaComponent
    },
    {
        name: "tcsmp:random_exp_damage",
        component: randomExpDamageComponent
    },
    {
        name: "tcsmp:lucks_bane",
        component: lucksBaneComponent
    },
    {
        name: "tcsmp:backstab",
        component: backstabComponent
    },
    {
        name: "tcsmp:gerbil",
        component: gerbilComponent
    },
    {
        name: "tcsmp:random_effect_on_hit",
        component: randomEffectOnHitComponent
    },
    {
        name: "tcsmp:global_cooldown",
        component: globalCooldownComponent
    },
    {
        name: "tcsmp:auto_lore",
        component: autoLoreComponent
    },
    {
        name: "tcsmp:durability_fix",
        component: durabilityFixComponent
    },
    {
        name: "tcsmp:nausea_spell",
        component: nauseaSpellComponent
    },
    {
        name: "tcsmp:undead_spell",
        component: undeadSpellComponent
    }
]

export default ItemComponents;
