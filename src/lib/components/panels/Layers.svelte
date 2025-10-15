<script lang="ts">
    import Panel from "./Panel.svelte";
    import docs from "../../scripts/docs.svelte";
    import { ButtonVisual } from "../ui";
    import IconButtonVisual from "../ui/IconButtonVisual.svelte";
    import { Plus, X } from "@lucide/svelte";
    import { createLayer, type LayerID } from "../../scripts/layer";
    import ui from "../../scripts/ui.svelte";

    function addLayer() {
        if (!docs.selected) return;

        const newLayer = createLayer("canvas", `Layer ${docs.selected.layers.length + 1}`);
        docs.selected.layers = [...docs.selected.layers, newLayer];
    }

    function removeLayer(layerId: LayerID) {
        if (!docs.selected) return;
        docs.selected.layers = docs.selected.layers.filter(layer => layer.id !== layerId);
        if (ui.selectedLayers[docs.selected.id].includes(layerId)) {
            ui.selectedLayers[docs.selected.id] = ui.selectedLayers[docs.selected.id].filter(id => id !== layerId);
        }
    }

    function selectLayer(layerId: LayerID) {
        if (!docs.selected) return;
        ui.selectedLayers[docs.selected.id] = [layerId];
    }
</script>

<Panel title="Layers">
    <div id="layers">
        {#if !docs.selected}
            <div>No document selected</div>
        {:else}
            {#each docs.selected.layers as layer }
                <div
                    class="layer"
                    class:selected={ui.selectedLayers[docs.selected.id]?.includes(layer.id)}
                    >
                    <button
                        class="preview"
                        onclick={() => selectLayer(layer.id)}
                    >
                        <div>{layer.name}</div>
                    </button>
                    <button onclick={() => removeLayer(layer.id)}>
                        <IconButtonVisual label="Remove Layer {layer.name}">
                            <X size={16}/>
                        </IconButtonVisual>
                    </button>
                </div>
            {/each}
        {/if}
        <div id="add">
            <button id="add-layer" disabled={!docs.selected} onclick={addLayer}>
                <ButtonVisual size="small" style="subtle" width="full" disabled={!docs.selected}>
                    <Plus />
                </ButtonVisual>
            </button>
        </div>
    </div>
</Panel>

<style>
    #layers {
        display: flex;
        flex-direction: column;
        gap: var(--s-xs);
        max-height: 300px;
        overflow-y: auto;
    }

    #add {
        margin-top: var(--s-sm);
    }

    #add-layer {
        width: 100%;
    }

    .layer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--s-xs);
        background-color: var(--c-bg);
        border-radius: var(--r-sm);
        gap: var(--s-xs);
    }

    .layer.selected {
        background-color: var(--c-acc);
    }

    .preview {
        display: flex;
        justify-content: flex-start;
        flex: 1;
        cursor: pointer;
    }
</style>