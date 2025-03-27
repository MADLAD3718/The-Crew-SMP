import { BlockCustomComponent } from "@minecraft/server";
import doubleBlockComponent from "./double_block";
import waystoneComponent from "./waystone";
import blockEntityComponent from "./block_entity";
import tickParticleComponent from "./tick_particle";

type BlockComponentRegister = {
    name: string
    component: BlockCustomComponent
}

/** An array containing all custom block components. */
const BlockComponents: BlockComponentRegister[] = [
    {
        name: "tcsmp:double_block",
        component: doubleBlockComponent
    },
    {
        name: "tcsmp:waystone",
        component: waystoneComponent
    },
    {
        name: "tcsmp:block_entity",
        component: blockEntityComponent
    },
    {
        name: "tcsmp:tick_particle",
        component: tickParticleComponent
    }
]

export default BlockComponents;
