import { ItemCustomComponent } from "@minecraft/server"
import spellScrollComponent from "./spell_scroll";
import returnSpellComponent from "./return_spell";
import thunderSpellComponent from "./thunder_spell";
import growthSpellComponent from "./growth_spell";
import decaySpellComponent from "./decay_spell";
import grapplingHookComponent from "./grappling_hook";
import katanaComponent from "./katana";
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
    }
]

export default ItemComponents;
