import { BlockCustomComponent, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { FactionRegister, FactionRegistry } from "../systems/factions";
import { NameRegistry } from "../systems/names";

const factionRegisterComponent: BlockCustomComponent = {
    onPlayerInteract(event) {
        const { player } = event;
        if (!player) return;

        player.playSound("item.book.page_turn");
        const faction = FactionRegistry.getFaction(player);

        if (!faction) createFaction(player);
        else {            
            if (faction.owner == player.id)
                editFaction(player, faction);
            else viewFaction(player, faction);
        }
    }
}

export default factionRegisterComponent;

function createFaction(owner: Player) {
    new ModalFormData()
        .title({translate: "action.create.faction.title"})
        .textField(
            { translate: "action.create.faction.name" },
            {
                translate: "action.create.faction.name_placeholder",
                with: [owner.name]
            }
        )
        .submitButton({translate: "action.create.faction.submit"})
        .show(owner).then(response => {
            if (response.canceled) return;

            const name = response.formValues?.[0] as string ?? "";

            if (name.length && FactionRegistry.addFaction({
                name, owner: owner.id, players: [owner.id]
            }))
                owner.sendMessage({translate: "action.create.faction.success", with: [name]});
            else owner.sendMessage({translate: "action.create.faction.fail", with: [name]});
        });
}

function viewFaction(player: Player, faction: FactionRegister) {
    new ActionFormData()
        .title({translate: "action.manage.faction.title"})
        .body({
            translate: "action.manage.faction.info", 
            with: [
                faction.name,
                NameRegistry.getName(faction.owner) as string,
                faction.players.slice(1).map(id => {
                    return NameRegistry.getName(id) as string;
                }).join(", ")
            ]
        })
        .button({translate: "action.manage.faction.leave", with: [faction.name]})
        .show(player).then(response => {
            if (!response.canceled)
                FactionRegistry.removePlayer(faction, player.id);
        });
}

function editFaction(owner: Player, faction: FactionRegister) {
    new ActionFormData()
        .title({translate: "action.manage.faction.title"})
        .body({translate: "action.manage.faction.body", with: [faction.name]})
        .button({translate: "action.manage.faction.edit_name"})
        .button({translate: "action.manage.faction.edit_players"})
        .button({translate: "action.manage.faction.delete"})
        .button({translate: "action.manage.faction.confirm"})
        .show(owner).then(response => {
            if (response.canceled) return;

            if (response.selection == 0)
                editFactionName(owner, faction);
            else if (response.selection == 1)
                editFactionPlayers(owner, faction);
            else if (response.selection == 2)
                deleteFaction(owner, faction);
        });
}

function editFactionName(owner: Player, faction: FactionRegister) {
    new ModalFormData()
        .title({translate: "action.manage.faction.edit_name"})
        .textField(
            { translate: "action.create.faction.name" },
            {
                translate: "action.create.faction.name_placeholder",
                with: [owner.name]
            },
            faction.name
        )
        .submitButton({translate: "action.manage.faction.confirm"})
        .show(owner).then(response => {
            if (response.canceled) return;

            const name = response.formValues?.[0] as string ?? "";
            if (name == faction.name) return;

            if (FactionRegistry.nameIsValid(name)) {
                FactionRegistry.removeFaction(faction);
                FactionRegistry.addFaction({
                    name: name,
                    owner: owner.id,
                    players: faction.players
                });
            }
            else owner.sendMessage({translate: "action.create.faction.fail", with: [name]});
        });
}

function editFactionPlayers(owner: Player, faction: FactionRegister) {
    const form = new ActionFormData()
        .title({translate: "action.manage.faction.edit_players"});
    
    const players = faction.players.slice(1);
    for (const id of players) form.button({
        translate: "action.manage.faction.kick",
        with: [NameRegistry.getName(id) as string]
    });

    form.button({translate: "action.manage.faction.confirm"})
        .show(owner).then(response => {
            if (response.canceled) return;
            
            if (response.selection != players.length) {
                FactionRegistry.removePlayer(faction, players[response.selection as number]);
                owner.sendMessage({
                    translate: "action.manage.faction.kick_success",
                    with: [
                        NameRegistry.getName(players[response.selection as number]) as string,
                        faction.name
                    ]
                });
            }
            else editFaction(owner, faction);
        });
}

function deleteFaction(owner: Player, faction: FactionRegister) {
    FactionRegistry.removeFaction(faction);
    owner.sendMessage({translate: "action.manage.faction.delete_success", with: [faction.name]});
}
