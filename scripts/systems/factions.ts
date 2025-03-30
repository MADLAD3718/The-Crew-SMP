import { Player, world } from "@minecraft/server";

export type FactionRegister = {
    name: string,
    owner: string,
    players: string[]
}

export namespace FactionRegistry {
    export function getFactions(): FactionRegister[] {
        const factions: FactionRegister[] = [];
        for (const id of world.getDynamicPropertyIds()) {
            const [type, name, owner] = id.split('/');
            if (type != "faction") continue;

            const players = (world.getDynamicProperty(id) as string).split('/');

            factions.push({ name, owner, players });
        }

        return factions;
    }

    export function getFaction(name: string): FactionRegister | undefined;
    export function getFaction(player: Player): FactionRegister | undefined;
    export function getFaction(arg: Player | string): FactionRegister | undefined {
        for (const id of world.getDynamicPropertyIds()) {
            const [type, name, owner] = id.split('/');
            if (type != "faction") continue;

            const players = (world.getDynamicProperty(id) as string).split('/');

            if (arg instanceof Player) {
                if (owner == arg.id || players.includes(arg.id))
                    return { name, owner, players };
            }
            else if (name == arg) return { name, owner, players };
        }

        return undefined;
    }

    export function nameIsValid(name: string): boolean {
        if (name.includes('/')) return false;
        for (const faction of getFactions())
            if (faction.name == name) return false;
        
        return true;
    }

    export function addFaction(faction: FactionRegister): boolean {
        if (!nameIsValid(faction.name)) return false;
        world.setDynamicProperty(
            `faction/${faction.name}/${faction.owner}`,
            faction.players.join('/')
        );
        const owner = world.getEntity(faction.owner) as Player;
        owner.nameTag = owner.name + `\n${faction.name}`;
        return true;
    }

    export function removeFaction(faction: FactionRegister): void {
        world.setDynamicProperty(`faction/${faction.name}/${faction.owner}`);
        for (const id of faction.players) {
            const player = world.getEntity(id) as Player | undefined;
            if (player) player.nameTag = player.name;
        }
    }

    export function addPlayer(faction: FactionRegister, playerId: string): void {
        faction.players.push(playerId);
        world.setDynamicProperty(
            `faction/${faction.name}/${faction.owner}`,
            faction.players.join('/')
        );
        const player = world.getEntity(playerId) as Player | undefined;
        if (player) player.nameTag = player.name + `\n${faction.name}`;
    }

    export function removePlayer(faction: FactionRegister, playerId: string): void {
        faction.players = faction.players.filter(id => {
            return id != playerId;
        });
        world.setDynamicProperty(
            `faction/${faction.name}/${faction.owner}`,
            faction.players.join('/')
        );
        const player = world.getEntity(playerId) as Player | undefined;
        if (player) player.nameTag = player.name;
    }
}
