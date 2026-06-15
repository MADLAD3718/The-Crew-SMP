import { defineConfig } from 'tsup';
import { Plugin } from "esbuild";
import * as fs from "fs";
import stripJSONComments from "strip-json-comments";

const JSONCommentPlugin: Plugin = {
    name: "json",
    setup(build) {
        build.onLoad({ filter: /\.json$/ }, async (args) => {
            const rawJSON = await fs.promises.readFile(args.path, "utf-8");
            const cleanedJSON = stripJSONComments(rawJSON);
            return {
                contents: cleanedJSON,
                loader: "json"
            }
        });
    }
}

export default defineConfig({
    format: ["esm"],
    entry: ["./scripts/main.ts"],
    skipNodeModulesBundle: true,
    clean: true,
    outDir: "./behaviours/scripts",
    noExternal: [
        "@madlad3718/mcveclib",
        "@minecraft/vanilla-data"
    ],
    sourcemap: true,
    minify: false,
    esbuildPlugins: [JSONCommentPlugin]
});
