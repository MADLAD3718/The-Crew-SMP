import { FactionColour } from "../systems/factions";

type CustomCommandEnum = {
    name: string,
    values: string[]
};

const CustomCommandEnums: CustomCommandEnum[] = [
    {
        name: "tcsmp:faction_colour",
        values: Object.keys(FactionColour)
    }
];

export default CustomCommandEnums;
