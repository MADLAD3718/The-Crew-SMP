import { BlockCustomComponent } from "@minecraft/server";

type TickParticleParameters = {
    particle: string
}

const tickParticleComponent: BlockCustomComponent = {
    onPlace({ dimension, block }, parameters) {
        const { params } = parameters as { params: TickParticleParameters };
        dimension.spawnParticle(params.particle, block.bottomCenter());
    },

    onTick({ dimension, block }, parameters) {
        const { params } = parameters as { params: TickParticleParameters };
        dimension.spawnParticle(params.particle, block.bottomCenter());
    }
}

export default tickParticleComponent;
