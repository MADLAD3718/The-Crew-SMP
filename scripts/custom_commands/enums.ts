import { DynamicPropertiesAction } from "./admin/dynamicproperties";
import { FactionColour } from "../systems/factions";

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
    }
];

export default CustomCommandEnums;
