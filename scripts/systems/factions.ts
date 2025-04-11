import { Player, world } from "@minecraft/server";

export enum FactionColour {
    Quartz = 'h',
    Iron = 'i',
    Netherite = 'j',
    Redstone = 'm',
    Copper = 'n',
    Gold = 'p',
    Emerald = 'q',
    Diamond = 's',
    Lapis = 't',
    Amethyst = 'u',
    Resin = 'v'
}

export type FactionRegister = {
    name: string,
    colour: FactionColour,
    owner: string,
    players: string[]
}

export namespace FactionRegistry {
    export function getFactions(): FactionRegister[] {
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

    export function nameIsValid(name: string): boolean {
        if (name.length > 16 || name.length == 0) return false;
        if (name.includes('/') || name.includes('§')) return false;
        for (const faction of getFactions())
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
        return true;
    }

    export function removeFaction(faction: FactionRegister): void {
        world.setDynamicProperty(`faction/${faction.name}/${faction.colour}/${faction.owner}`);
        for (const id of faction.players) {
            const player = world.getEntity(id) as Player | undefined;
            if (player) player.nameTag = player.name;
        }
    }

    export function addPlayer(faction: FactionRegister, playerId: string): void {
        faction.players.push(playerId);
        world.setDynamicProperty(
            `faction/${faction.name}/${faction.colour}/${faction.owner}`,
            faction.players.join('/')
        );
        const player = world.getEntity(playerId) as Player | undefined;
        if (player) player.nameTag = player.name + `\n§${faction.colour}${faction.name}§r`;
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
    }
}
