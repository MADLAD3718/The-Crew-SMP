import { ItemCustomComponent } from "@minecraft/server"
import spellScrollComponent from "./spell_scroll";
import returnSpellComponent from "./return_spell";
import thunderSpellComponent from "./thunder_spell";
import growthSpellComponent from "./growth_spell";
import decaySpellComponent from "./decay_spell";
import grapplingHookComponent from "./grappling_hook";
import katanaComponent from "./katana";
import factionInviteComponent from "./faction_invite";
import randomExpDamageComponent from "./random_exp_damage";
import lucksBaneComponent from "./lucks_bane";
import backstabberComponent from "./backstabber";
import "./double_block_placer";
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
        name: "tcsmp:faction_invite",
        component: factionInviteComponent
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
        name: "tcsmp:backstabber",
        component: backstabberComponent
    }
]

export default ItemComponents;
