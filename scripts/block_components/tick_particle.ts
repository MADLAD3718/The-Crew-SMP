import { BlockCustomComponent } from "@minecraft/server";

const tickParticleComponent: BlockCustomComponent = {
    onPlace({ dimension, block }) {
        dimension.spawnParticle(block.getTagProperty("particle") as string, block.bottomCenter());
    },

    onTick({ dimension, block }) {
        dimension.spawnParticle(block.getTagProperty("particle") as string, block.bottomCenter());
    }
}

export default tickParticleComponent;
