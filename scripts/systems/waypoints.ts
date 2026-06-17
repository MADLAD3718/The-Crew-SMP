import { Player, PlayerWaypoint, RGB, WaypointTexture } from "@minecraft/server";
import { FactionColour, FactionRegistry } from "./factions";

export class FactionWaypoint extends PlayerWaypoint {
    constructor(player: Player) {
        super(player, {
            textureBoundsList: [
                {
                    texture: WaypointTexture.Square,
                    lowerBound: 0,
                    upperBound: 179
                },
                {
                    texture: WaypointTexture.Circle,
                    lowerBound: 179,
                    upperBound: 230
                },
                {
                    texture: WaypointTexture.SmallSquare,
                    lowerBound: 230,
                    upperBound: 281
                },
                {
                    texture: WaypointTexture.SmallStar,
                    lowerBound: 281
                }
            ]
        },
        {
            showSpectator: false,
            showHidden: false,
            showSpectatorToSpectator: true,
            showDead: false,
            showInvisible: false,
            showSneaking: false
        });
        this.color = FactionColourMap[FactionRegistry.getFaction(player)!.colour];
    }
}

export const FactionColourMap: Record<FactionColour, RGB> = {
    [FactionColour.amethyst]: {red: 0.59, green: 0.37, blue: 0.76},
    [FactionColour.copper]: {red: 0.67, green: 0.43, blue: 0.32},
    [FactionColour.diamond]: {red: 0.33, green: 0.71, blue: 0.66},
    [FactionColour.emerald]: {red: 0.24, green: 0.61, blue: 0.25},
    [FactionColour.gold]: {red: 0.84, green: 0.71, blue: 0.25},
    [FactionColour.iron]: {red: 0.8, green: 0.79, blue: 0.79},
    [FactionColour.lapis]: {red: 0.18, green: 0.28, blue: 0.47},
    [FactionColour.netherite]: {red: 0.26, green: 0.23, blue: 0.23},
    [FactionColour.quartz]: {red: 0.88, green: 0.84, blue: 0.82},
    [FactionColour.redstone]: {red: 0.55, green: 0.17, blue: 0.07},
    [FactionColour.resin]: {red: 0.87, green: 0.49, blue: 0.16}
}
