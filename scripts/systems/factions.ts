import { DynamicPropertyDatabase } from "./dynamic_property_database";
import { Player, world } from "@minecraft/server";
import { WaypointManager } from "./waypoints";

const FactionDatabase = new DynamicPropertyDatabase(world, "faction", "owner", "name", "colour");

export enum FactionColour {
    quartz = 'h',
    iron = 'i',
    netherite = 'j',
    redstone = 'm',
    copper = 'n',
    gold = 'p',
    emerald = 'q',
    diamond = 's',
    lapis = 't',
    amethyst = 'u',
    resin = 'v'
}

export type FactionRegister = {
    name: string,
    colour: FactionColour,
    owner: string,
    players: string[]
}

export namespace FactionRegistry {
    export function getAllFactions(): FactionRegister[] {
        return FactionDatabase.findAll().map(match => {
            return {
                name: match.field.name,
                colour: match.field.colour as FactionColour,
                owner: match.field.owner,
                players: (match.value as string).split('/')
            };
        });
    }

    export function getFaction(name: string): FactionRegister | undefined;
    export function getFaction(player: Player): FactionRegister | undefined;
    export function getFaction(arg: Player | string): FactionRegister | undefined {
        return FactionDatabase.findAll().filter(match => {
            const players = (match.value as string).split('/');
            if (arg instanceof Player) {
                return match.field.owner == arg.id || players.includes(arg.id)
            }
            else return (match.field.name == arg);
        }).map(match => {
            return {
                name: match.field.name,
                colour: match.field.colour as FactionColour,
                owner: match.field.owner,
                players: (match.value as string).split('/')
            };
        })[0];
    }

    export function nameIsValid(name: string): boolean {
        if (name.length > 24 || name.length == 0) return false;
        if (name.includes('/') || name.includes('§')) return false;
        for (const faction of getAllFactions())
            if (faction.name == name) return false;
        
        return true;
    }

    export function addFaction(faction: FactionRegister): boolean {
        if (!nameIsValid(faction.name)) return false;
        FactionDatabase.write(faction, faction.players.join('/'));
        for (const id of faction.players) {
            const player = world.getEntity(id) as Player | undefined;
            if (player) player.nameTag = player.name + `\n§${faction.colour}${faction.name}§r`;
        }
        WaypointManager.refreshFactionWaypoints();
        return true;
    }

    export function removeFaction(faction: FactionRegister): void {
        FactionDatabase.write(faction);
        for (const id of faction.players) {
            const player = world.getEntity(id) as Player | undefined;
            if (player) player.nameTag = player.name;
        }
        WaypointManager.refreshFactionWaypoints();
    }

    export function addPlayer(faction: FactionRegister, playerId: string): void {
        faction.players.push(playerId);
        FactionDatabase.write(faction, faction.players.join('/'));
        const player = world.getEntity(playerId) as Player | undefined;
        if (player) player.nameTag = player.name + `\n§${faction.colour}${faction.name}§r`;
        WaypointManager.refreshFactionWaypoints();
    }

    export function removePlayer(faction: FactionRegister, playerId: string): void {
        faction.players = faction.players.filter(id => {
            return id != playerId;
        });
        FactionDatabase.write(faction, faction.players.join('/'));
        const player = world.getEntity(playerId) as Player | undefined;
        if (player) player.nameTag = player.name;
        WaypointManager.refreshFactionWaypoints();
    }

    export function sendMessage(faction: FactionRegister, message: string): void {
        if (message.length) for (const id of faction.players) {
            const player = world.getEntity(id) as Player | undefined;
            player?.sendMessage(`§${faction.colour}[${faction.name}]§r ${message}`);
        }
    }

    export function invitePlayer(faction: FactionRegister, player: Player): void {
        player.setDynamicProperty("tcsmp:faction_invite", faction.name);
    }
}
