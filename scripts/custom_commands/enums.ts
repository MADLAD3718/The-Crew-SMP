import { FactionColour } from "../systems/factions";
import { DynamicPropertiesAction, DynamicPropertiesField } from "./admin/dynamicproperties";

type CustomCommandEnum = {
    name: string,
    values: string[]
};

const CustomCommandEnums: CustomCommandEnum[] = [
    {
        name: "tcsmp:faction_colour",
        values: Object.keys(FactionColour)
    },
    {
        name: "tcsmp:dynamicproperties_action",
        values: Object.values(DynamicPropertiesAction)
    },
    {
        name: "tcsmp:dynamicproperties_field",
        values: Object.values(DynamicPropertiesField)
    }
];

export default CustomCommandEnums;
