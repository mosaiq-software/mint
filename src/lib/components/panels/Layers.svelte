<script lang="ts">
    import Panel from "./Panel.svelte";
    import { getSelectedDoc } from "../../scripts/docs.svelte";
    import { ButtonVisual } from "../ui";
    import IconButtonVisual from "../ui/IconButtonVisual.svelte";
    import { Plus, X } from "@lucide/svelte";
    import type { Layer, LayerID } from "../../scripts/docs.svelte";

    const doc = $derived(getSelectedDoc());

    function addLayer() {
        if (!doc) return;

        const newLayer: Layer = {
            type: 'canvas',
            id: 'layer-' + crypto.randomUUID() as LayerID,
            name: `Layer ${doc.layers.length + 1}`,
            visible: true,
            opacity: 1,
            transform: { matrix: new DOMMatrix() },
            canvas: new OffscreenCanvas(doc.width, doc.height),
        };
        doc.layers = [...doc.layers, newLayer];
    }

    function removeLayer(layerId: LayerID) {
        if (!doc) return;
        doc.layers = doc.layers.filter(layer => layer.id !== layerId);
    }
</script>

<Panel title="Layers">
    <div id="layers">

    </div>
    {#if !doc}
        <div>No document selected</div>
    {:else}
        {#each doc.layers as layer }
            <div class="layer">
                <div>{layer.name}</div>
                <button onclick={() => removeLayer(layer.id)}>
                    <IconButtonVisual label="Remove Layer {layer.name}">
                        <X size={16}/>
                    </IconButtonVisual>
                </button>
            </div>
        {/each}
    {/if}
    <div id="add">
        <button id="add-layer" disabled={!doc} onclick={addLayer}>
            <ButtonVisual size="small" style="subtle" width="full" disabled={!doc}>
                <Plus />
            </ButtonVisual>
        </button>
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
</style>