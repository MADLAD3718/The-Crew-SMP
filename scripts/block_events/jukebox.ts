import { BlockComponentTypes, world } from "@minecraft/server";
import { MinecraftBlockTypes } from "@minecraft/vanilla-data";
import { Vec3 } from "@madlad3718/mcveclib";

const RecordMap: Record<string, string> = {};
const RECORD_SOUNDS: Record<string, string> = {
    "tcsmp:music_disc_drop_it": "record.drop_it",
    "tcsmp:music_disc_crackas": "record.crackas",
    "tcsmp:music_disc_puma_pants": "record.puma_pants",
    "tcsmp:music_disc_based_boys": "record.based_boys",
    "tcsmp:music_disc_obama": "record.obama",
    "tcsmp:music_disc_straight_facts": "record.straight_facts",
}

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const { block } = event, { location } = block;
    if (!block.matches(MinecraftBlockTypes.Jukebox)) return;

    const player = block.getComponent(BlockComponentTypes.RecordPlayer);
    if (!player?.isPlaying()) return;

    RecordMap[Vec3.toString(location)] = player.getRecord()!.typeId;
});

world.afterEvents.playerInteractWithBlock.subscribe(event => {
    const { block } = event, { dimension, location } = block;
    if (!block.matches(MinecraftBlockTypes.Jukebox)) return;

    const stringLocation = Vec3.toString(location);
    const player = block.getComponent(BlockComponentTypes.RecordPlayer);
    if (player?.isPlaying()) return;

    const sound = RECORD_SOUNDS[RecordMap[stringLocation] ?? "none"];
    for (const player of dimension.getPlayers({
        location: block.center(), maxDistance: 64
    })) player.stopSound(sound);
});

world.beforeEvents.playerBreakBlock.subscribe(event => {
    const { block } = event, { location } = block;

    const player = block.getComponent(BlockComponentTypes.RecordPlayer);
    if (!player?.isPlaying()) return;

    RecordMap[Vec3.toString(location)] = player.getRecord()!.typeId;
}, {blockTypes: [MinecraftBlockTypes.Jukebox]});

world.afterEvents.playerBreakBlock.subscribe(event => {
    const { block } = event, { dimension, location } = block;

    const stringLocation = Vec3.toString(location);
    const sound = RECORD_SOUNDS[RecordMap[stringLocation]];
    for (const player of dimension.getPlayers({
        location: block.center(), maxDistance: 64
    })) player.stopSound(sound);
}, {blockTypes: [MinecraftBlockTypes.Jukebox]});
