import { Block, BlockCustomComponent, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { Vec3 } from "@madlad3718/mcveclib";

import { WaystoneRegister, WaystoneRegistry } from "../systems/waystones";
import { BlockEntityRegistry } from "../systems/block_entities";

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

function setupWaystone(base: Block, top: Block, player: Player) {
    new ModalFormData()
        .title({translate: "action.setup.waystone.title"})
        .textField(
            {translate: "action.setup.waystone.name"},
            {translate: "action.setup.waystone.placeholder", with: [player.name]}
        )
        .toggle({translate: "action.setup.waystone.private"})
        .show(player).then(response => {
            if (response.canceled) return;

            const name = response.formValues?.[0] as string || `${player.name}'s Waystone`;
            const owner = response.formValues?.[1] ? player.id : "";

            const waystone: WaystoneRegister = {
                name,
                owner,
                dimension: player.dimension.id,
                location: base.location
            };

            if (!WaystoneRegistry.valid(waystone))
                return player.sendMessage({translate: "info.waystone.invalid", with: [name]});

            if (WaystoneRegistry.has(player, waystone))
                return player.sendMessage({translate: "info.waystone.preexists", with: [name]});

            WaystoneRegistry.add(waystone);

            base.setPermutation(base.permutation.withState("tcsmp:active", true));
            top.setPermutation(top.permutation.withState("tcsmp:active", true));
        });
}

function useWaystone(base: Block, player: Player) {
    const waystones: WaystoneRegister[] = [];

    const form = new ActionFormData().title({translate: "action.interact.waystone.title"});

    const registry = WaystoneRegistry.get(player);
    for (const waystone of registry) {
        if (Vec3.equal(waystone.location, base.location)) continue;
        if (waystone.owner != "") continue;
        form.button(waystone.name, "textures/ui/waystone_global_glyph");
        waystones.push(waystone);
    }
    for (const waystone of registry) {
        if (Vec3.equal(waystone.location, base.location)) continue;
        if (waystone.owner == "") continue;
        form.button(waystone.name, "textures/ui/waystone_private_glypth");
        waystones.push(waystone);
    }

    form.show(player).then(response => {
        if (response.canceled) return;
        
        const target = waystones[response.selection as number];
        player.playSound("waystone.teleport");
        player.camera.fade({
            fadeColor: {red: 0.914, green: 0.882, blue: 0.851},
            fadeTime: {
                fadeInTime: 0.0,
                holdTime: 1.0,
                fadeOutTime: 0.8
            }
        });
        player.teleport(target.location);
    });
}

function editWaystone(waystone: WaystoneRegister, player: Player) {
    new ModalFormData()
        .title({translate: "action.edit.waystone.title"})
        .textField(
            {translate: "action.setup.waystone.name"},
            waystone.name
        )
        .toggle({translate: "action.setup.waystone.private"}, { defaultValue: waystone.owner != "" })
        .show(player).then(response => {
            if (response.canceled) return;

            const name = response.formValues?.[0] as string || waystone.name;
            const owner = response.formValues?.[1] ? player.id : "";

            const new_waystone: WaystoneRegister = {
                name,
                owner,
                dimension: player.dimension.id,
                location: waystone.location
            };

            if (!WaystoneRegistry.valid(waystone))
                return player.sendMessage({translate: "info.waystone.invalid", with: [name]});

            if (name != waystone.name && WaystoneRegistry.has(player, waystone))
                return player.sendMessage({translate: "info.waystone.preexists", with: [name]});

            WaystoneRegistry.remove(waystone);
            WaystoneRegistry.add(new_waystone);
        });
}
