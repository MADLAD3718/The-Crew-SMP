import { CustomForm, ObservableString, ObservableBoolean } from "@minecraft/server-ui";
import { Block, BlockCustomComponent, Player } from "@minecraft/server";
import { Vec3 } from "@madlad3718/mcveclib";

import { WaystoneRegister, WaystoneRegistry } from "../systems/waystones";
import { BlockEntityRegistry } from "../systems/block_entities";
import { NameRegistry } from "../systems/names";

type WaystoneParameters = {
    dimension: string
}

const waystoneComponent: BlockCustomComponent = {
    // Place is triggered for all multi-block parts
    onPlace({ block }) {
        if (block.permutation.getState("minecraft:multi_block_part") == 1)
            BlockEntityRegistry.spawn(block, "tcsmp:warp_crystal");
    },

    onPlayerInteract({ block, player, dimension }, parameters) {
        const { params } = parameters as { params: WaystoneParameters };

        if (dimension.id != params.dimension) return;
        const { permutation } = block;

        dimension.playSound("use.waystone", block.center());

        const states = permutation.getAllStates();
        const base = states["minecraft:multi_block_part"] === 0 ? block : block.below()!;
        const top = states["minecraft:multi_block_part"] === 0 ? block.above()! : block;
        if (!states["tcsmp:active"])
            setupWaystone(base, top, player!);
        else if (!player?.isSneaking)
            useWaystone(base, player!);
        else editWaystone(WaystoneRegistry.find(base) as WaystoneRegister, player!);
    },

    // Break is just triggered once for the multi-block part the player broke
    onBreak({ block, brokenBlockPermutation }) {
        const states = brokenBlockPermutation.getAllStates();
        BlockEntityRegistry.remove(
            states["minecraft:multi_block_part"] == 0 ? block.above()! : block
        );

        if (!states["tcsmp:active"]) return;

        const base = states["minecraft:multi_block_part"] == 0 ? block : block.below()!;
        WaystoneRegistry.remove(WaystoneRegistry.find(base)!);
    }
}

export default waystoneComponent;

function setupWaystone(base: Block, top: Block, player: Player): void {
    const name_input = new ObservableString("", {clientWritable: true});
    const is_private = new ObservableBoolean(false, {clientWritable: true});
    const form = new CustomForm(player, {translate: "form.setup.waystone.title"})
        .textField({translate: "form.setup.waystone.name"}, name_input)
        .toggle({translate: "form.setup.waystone.private"}, is_private)
        .divider().button({translate: "form.setup.waystone.submit"}, () => {
            form.close();

            const name = name_input.getData();
            const owner = is_private.getData() ? player.id : "";

            const waystone: WaystoneRegister = {
                name,
                owner,
                dimension: player.dimension.id,
                location: base.location
            };

            if (!WaystoneRegistry.valid(waystone))
                return player.onScreenDisplay.setActionBar({translate: "info.waystone.invalid", with: [waystone.name]});

            if (WaystoneRegistry.has(player, waystone))
                return player.onScreenDisplay.setActionBar({
                    translate: waystone.owner ? "info.waystone.preexists.private" : "info.waystone.preexists.global",
                    with: [waystone.name]
                });

            player.dimension.playSound("use.waystone", base.center());
            
            WaystoneRegistry.add(waystone);

            base.setPermutation(base.permutation.withState("tcsmp:active", true));
            top.setPermutation(top.permutation.withState("tcsmp:active", true));
        });
    form.show();
}

function useWaystone(base: Block, player: Player): void {
    const form = new CustomForm(player, {translate: "form.interact.waystone.title"});

    const registry = WaystoneRegistry.get(player);
    for (const waystone of registry) {
        if (Vec3.equal(waystone.location, base.location)) continue;
        form.button(waystone.name, () => {
            form.close();
            teleportToWaystone(player, waystone);
        }, { tooltip: {
            translate: waystone.owner ? "form.interact.waystone.private" : "form.interact.waystone.global",
            with: [NameRegistry.getName(waystone.owner) ?? ""]
        }});
    }
    form.show();
}

function editWaystone(waystone: WaystoneRegister, player: Player): void {
    const name_input = new ObservableString(waystone.name, {clientWritable: true});
    const is_private = new ObservableBoolean(!!waystone.owner, {clientWritable: true});
    const form = new CustomForm(player, {translate: "form.edit.waystone.title"})
        .textField({translate: "form.setup.waystone.name"}, name_input)
        .toggle({translate: "form.setup.waystone.private"}, is_private)
        .divider().button({translate: "form.setup.waystone.submit"}, () => {
            form.close();

            const name = name_input.getData();
            const owner = is_private.getData() ? player.id : "";

            const new_waystone: WaystoneRegister = {
                name,
                owner,
                dimension: player.dimension.id,
                location: waystone.location
            };

            if (!WaystoneRegistry.valid(new_waystone))
                return player.onScreenDisplay.setActionBar({translate: "info.waystone.invalid", with: [waystone.name]});

            if (WaystoneRegistry.has(player, new_waystone))
                return player.onScreenDisplay.setActionBar({
                    translate: waystone.owner ? "info.waystone.preexists.private" : "info.waystone.preexists.global",
                    with: [waystone.name]
                });

            player.dimension.playSound("use.waystone", Vec3.add(waystone.location, Vec3.from(0.5)));

            WaystoneRegistry.remove(waystone);
            WaystoneRegistry.add(new_waystone);
        });
    form.show();
}

function teleportToWaystone(player: Player, waystone: WaystoneRegister): void {
    player.playSound("waystone.teleport");
    player.camera.fade({
        fadeColor: {red: 0.914, green: 0.882, blue: 0.851},
        fadeTime: {
            fadeInTime: 0.0,
            holdTime: 1.0,
            fadeOutTime: 0.8
        }
    });
    player.teleport(waystone.location);
}
