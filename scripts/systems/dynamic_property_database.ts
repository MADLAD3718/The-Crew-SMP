import { Block, Entity, World, world } from "@minecraft/server";

/** A database of dynamic properties with identifiers consisting of arbitrary index keys. */
export class DynamicPropertyDatabase<const T extends string[]> {
    private readonly dataFields: readonly T[number][];

    /**
     * Constructs a dynamic property database with an arbitrary list of index keys.
     * @param medium The storage medium used to store dynamic properties.
     * @param id The identifier of this database.
     * @param dataFields A list of string fields the database will use to index values.
     */
    constructor(private readonly medium: World | Entity, public readonly id: string, ...dataFields: T) {
        this.dataFields = dataFields;
    }

    /**
     * Writes a dynamic property value to a database field.
     * Optionally intakes just a field parameter to write undefined to the field.
     * @param field The full data field to write a value to.
     * @param value The dynamic property value to write.
     */
    public write(field: Record<T[number], string>, value?: Parameters<typeof this.medium.setDynamicProperty>[1]) {
        const values = this.dataFields.map(key => field[key]);
        const identifier = [this.id, ...values].join('/');
        return this.medium.setDynamicProperty(identifier, value);
    }

    /**
     * Reads a dynamic property value from a database field.
     * @param field The full data field to read a value from.
     * @returns The dynamic property stored in this field.
     * Returns undefined if there is no property stored.
     */
    public read(field: Record<T[number], string>) {
        const values = this.dataFields.map(key => field[key]);
        const identifier = [this.id, ...values].join('/');
        return this.medium.getDynamicProperty(identifier);
    }

    /**
     * Finds and returns all data fields and their corresonding values that cause 
     * the predicate function to return true.
     * @param predicate A predicate used to evaluate every database field and determine
     * if it should be included in the resulting array or not.
     * @returns An array of objects containing each field and its corresponding value
     * that passed the predicate test.
     */
    public findAll(predicate?: (field: Record<T[number], string>) => boolean) {
        const matches = [];

        for (const identifier of this.medium.getDynamicPropertyIds()) {
            const values = identifier.split('/');
            if (values[0] != this.id) continue;

            const field = this.dataFields.reduce((object, key, index) => {
                object[key] = values[index + 1];
                return object;
            }, {} as Record<T[number], string>);
            
            if (!predicate || predicate(field))
                matches.push({ field, value: this.medium.getDynamicProperty(identifier) });
        }

        return matches;
    }
}
