import { Player, world } from "@minecraft/server";
import { FactionWaypoint } from "./waypoints";

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
        const factions: FactionRegister[] = [];
        for (const id of world.getDynamicPropertyIds()) {
            const [type, name, colour, owner] = id.split('/');
            if (type != "faction") continue;

            const players = (world.getDynamicProperty(id) as string).split('/');

            factions.push({ name, colour: colour as FactionColour, owner, players });
        }

        return factions;
    }

    export function getFaction(name: string): FactionRegister | undefined;
    export function getFaction(player: Player): FactionRegister | undefined;
    export function getFaction(arg: Player | string): FactionRegister | undefined {
        for (const id of world.getDynamicPropertyIds()) {
            const [type, name, colour, owner] = id.split('/');
            if (type != "faction") continue;

            const players = (world.getDynamicProperty(id) as string).split('/');

            if (arg instanceof Player) {
                if (owner == arg.id || players.includes(arg.id))
                    return { name, colour: colour as FactionColour, owner, players };
            }
            else if (name == arg) return { name, colour: colour as FactionColour, owner, players };
        }

        return undefined;
    }

    export function getFactionFromId(playerId: string): FactionRegister | undefined {
        for (const id of world.getDynamicPropertyIds()) {
            const [type, name, colour, owner] = id.split('/');
            if (type != "faction") continue;

            const players = (world.getDynamicProperty(id) as string).split('/');

            if (owner == playerId || players.includes(playerId))
                return { name, colour: colour as FactionColour, owner, players };
        }

        return undefined;
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
        world.setDynamicProperty(
            `faction/${faction.name}/${faction.colour}/${faction.owner}`,
            faction.players.join('/')
        );
        for (const id of faction.players) {
            const player = world.getEntity(id) as Player | undefined;
            if (player) player.nameTag = player.name + `\n§${faction.colour}${faction.name}§r`;
        }
        updateWaypoints();
        return true;
    }

    export function removeFaction(faction: FactionRegister): void {
        world.setDynamicProperty(`faction/${faction.name}/${faction.colour}/${faction.owner}`);
        for (const id of faction.players) {
            const player = world.getEntity(id) as Player | undefined;
            if (player) player.nameTag = player.name;
        }
        updateWaypoints();
    }

    export function addPlayer(faction: FactionRegister, playerId: string): void {
        faction.players.push(playerId);
        world.setDynamicProperty(
            `faction/${faction.name}/${faction.colour}/${faction.owner}`,
            faction.players.join('/')
        );
        const player = world.getEntity(playerId) as Player | undefined;
        if (player) player.nameTag = player.name + `\n§${faction.colour}${faction.name}§r`;
        updateWaypoints();
    }

    export function removePlayer(faction: FactionRegister, playerId: string): void {
        faction.players = faction.players.filter(id => {
            return id != playerId;
        });
        world.setDynamicProperty(
            `faction/${faction.name}/${faction.colour}/${faction.owner}`,
            faction.players.join('/')
        );
        const player = world.getEntity(playerId) as Player | undefined;
        if (player) player.nameTag = player.name;
        updateWaypoints();
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

    export function updateWaypoints(): void {
        const players = world.getAllPlayers();

        for (const player of players)
            player.locatorBar.removeAllWaypoints();

        for (const player of players) {
            const faction = getFaction(player);
            if (!faction) continue;

            const waypoint = new FactionWaypoint(player);

            for (const memberId of faction.players) {
                if (memberId == player.id) continue;

                const member = world.getEntity(memberId) as Player;
                if (!member) continue;

                if (!member.locatorBar.hasWaypoint(waypoint))
                    member.locatorBar.addWaypoint(waypoint);
            }
        }
    }
}
