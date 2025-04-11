import { EquipmentSlot, ItemCustomComponent } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { FactionRegister, FactionRegistry } from "../systems/factions";

const factionInviteComponent: ItemCustomComponent = {
    onUse({ source, itemStack }) {
        const slot = source.equipment.getEquipmentSlot(EquipmentSlot.Mainhand);

        if (!itemStack?.getLore().length) {
            const faction = FactionRegistry.getFaction(source);
            if (!faction) return source.sendMessage({translate: "action.setup.faction_invite.no_factions"});


            new ModalFormData()
                .title({translate: "action.setup.faction_invite.title"})
                .textField(
                    {translate: "action.setup.faction_invite.message"},
                    {translate: "action.setup.faction_invite.message_placeholder", with: [faction.name]}
                )
                .submitButton({translate: "action.setup.faction_invite.submit"})
                .show(source).then(response => {
                    if (response.canceled) return;
                    slot.setLore([`Invites to: ${faction.name}`]);
                    slot.setDynamicProperty("message", response.formValues?.[0]);
                });
        }
        else {
            const faction = FactionRegistry.getFaction(source);
            if (faction) return source.sendMessage({translate: "action.join.faction.fail"});

            const name = itemStack.getLore()[0].slice(12);
            const invitedFaction = FactionRegistry.getFaction(name);
            if (!invitedFaction) {
                source.sendMessage({
                    translate: "action.join.faction.invalid",
                    with: [name]
                });
                return source.equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem();
            }

            const form = new ActionFormData()
                .title({translate: "action.join.faction.title"});
            
            const message = itemStack.getDynamicProperty("message") as string | undefined;

            if (message) form.body(message);

            form.button({
                    translate: "action.join.faction.accept",
                    with: [invitedFaction.colour, invitedFaction.name]
                })
                .button({translate: "action.join.faction.reject"})
                .show(source).then(response => {
                    if (response.canceled) return;

                    slot.setItem();
                    if (response.selection == 0) {
                        FactionRegistry.addPlayer(invitedFaction as FactionRegister, source.id);
                    }
                });
        }
    }
}

export default factionInviteComponent;
