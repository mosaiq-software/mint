<script lang="ts">
    import docs from "../scripts/docs.svelte";
    import ui from "../scripts/ui.svelte";
    import { ZoomIn, ZoomOut } from "@lucide/svelte";
    import { IconButtonVisual } from "./ui";

    const zoom = $derived(ui.selected?.zoom ?? 0);
    const zoomStr = $derived(`${(zoom * 100).toFixed(2)}%`);

    function zoomOut() {
        if (ui.selected) {
            ui.selected.zoom /= 1.1;
        }
    }

    function zoomIn() {
        if (ui.selected) {
            ui.selected.zoom *= 1.1;
        }
    }
</script>

{#if docs.selected}
    <div id="zoom">
        <button onclick={zoomOut}>
            <IconButtonVisual label="Zoom out">
                <ZoomOut size={16} />
            </IconButtonVisual>
        </button>
        {zoomStr}
        <button onclick={zoomIn}>
            <IconButtonVisual label="Zoom in">
                <ZoomIn size={16} />
            </IconButtonVisual>
        </button>
    </div>
{/if}

<style>
    #zoom {
        width: calc(250px - var(--s-sm) + var(--s-xs) / 2);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--s-sm);
        flex-shrink: 0;
        height: 100%;
        border-left: var(--s-xs) solid var(--c-mid);
    }
</style>