import { BlockCustomComponent } from "@minecraft/server";
import waystoneComponent from "./waystone";
import tickParticleComponent from "./tick_particle";
import cropComponent from "./crop";

type BlockComponentRegister = {
    name: string
    component: BlockCustomComponent
}

/** An array containing all custom block components. */
const BlockComponents: BlockComponentRegister[] = [
    {
        name: "tcsmp:waystone",
        component: waystoneComponent
    },
    {
        name: "tcsmp:tick_particle",
        component: tickParticleComponent
    },
    {
        name: "tcsmp:crop",
        component: cropComponent
    }
]

export default BlockComponents;
