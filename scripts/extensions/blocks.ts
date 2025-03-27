import { Block, BlockPermutation } from "@minecraft/server";

declare module "@minecraft/server" {
    interface Block {
        /**
         * Gets a property associated with a tag on the block.
         * @param id The identifier of the tag property.
         * @returns The value of the tag property.
         */
        getTagProperty(id: string): string | undefined;
    }
    interface BlockPermutation {
        /**
         * Gets a property associated with a tag on the permutation.
         * @param id The identifier of the tag property.
         * @returns The value of the tag property.
         */
        getTagProperty(id: string): string | undefined;
    }
}

Block.prototype.getTagProperty = function (id: string): string | undefined {
    return this.getTags().find(tag => tag.startsWith(id + ":"))?.slice(id.length + 1);
}

BlockPermutation.prototype.getTagProperty = function (id: string): string | undefined {
    return this.getTags().find(tag => tag.startsWith(id + ":"))?.slice(id.length + 1);
}
