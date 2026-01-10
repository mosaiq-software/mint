import { defineConfig, loadEnv } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");

    const baseTitle = "Mint Editor";
    const suffix = env.ENVIRONMENT_NAME ? ` (${env.ENVIRONMENT_NAME})` : "";
    const fullTitle = baseTitle + suffix;

    return {
        plugins: [
            svelte(),
            {
                name: "html-transform",
                transformIndexHtml(html) {
                    return html.replace("__APP_TITLE__", fullTitle);
                },
            },
        ],
    };
});
