import { BlockStateSuperset } from "@minecraft/vanilla-data";

type CustomBlockStates = {
    ['tcsmp:growth_stage']?: number;
    ['tcsmp:active']?: boolean;
    ['tcsmp:growth']?: number;
}

type BlockStateSuperSet = BlockStateSuperset & CustomBlockStates;

declare module "@minecraft/server" {
    interface BlockPermutation {
        /**
         * @remarks
         * Gets a state for the permutation.
         *
         * @param stateName
         * Name of the block state who's value is to be returned.
         * @returns
         * Returns the state if the permutation has it, else
         * `undefined`.
         */
        getState<T extends keyof BlockStateSuperSet>(
            stateName: T,
        ): BlockStateSuperSet[T] | undefined;
        /**
         * @remarks
         * Returns all available block states associated with this
         * block.
         *
         * @returns
         * Returns the list of all of the block states that the
         * permutation has.
         */
        getAllStates(): Partial<BlockStateSuperSet>;
        /**
         * @remarks
         * Returns a derived BlockPermutation with a specific property
         * set.
         *
         * @param name
         * Identifier of the block property.
         * @param value
         * Value of the block property.
         * @throws This function can throw errors.
         */
        withState<T extends keyof BlockStateSuperSet>(
            name: T,
            value: BlockStateSuperSet[T],
        ): BlockPermutation;
    }
}
