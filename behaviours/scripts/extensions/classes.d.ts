import "@minecraft/server"

declare module "@minecraft/server" {
    interface Container {
        /**
         * Returns the index of the first item in the container where predicate is
         * true, and -1 otherwise.
         * @param predicate Called once for each item of the container, in ascending
         * order, until it returns true. If an item is found, findIndex immediately
         * returns that item index. Otherwise, findIndex returns -1.
         */
        findIndex(predicate: (item?: ItemStack) => boolean): number;
        /**
         * Returns the first item in the container where predicate is true, and
         * undefined otherwise.
         * @param predicate Called once for each item of the container, in ascending
         * order, until it returns true. If an item is found, findItem immediately
         * returns that item. Otherwise, findItem returns undefined.
         */
        findItem(predicate: (item?: ItemStack) => boolean): ItemStack | undefined;
    }
}
