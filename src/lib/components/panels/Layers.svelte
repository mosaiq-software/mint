<script lang="ts">
    import Panel from "./Panel.svelte";
    import { getSelectedDoc } from "../../scripts/docs.svelte";
    import { ButtonVisual } from "../ui";
    import IconButtonVisual from "../ui/IconButtonVisual.svelte";
    import { Plus, X, Eye, EyeOff, Type, Image } from "@lucide/svelte";
    import { createLayer, type LayerID, type Layer } from "../../scripts/layer";
    import ui from "../../scripts/ui.svelte";
    import Input from "../ui/Input.svelte";

    const doc = $derived(getSelectedDoc());

    function addLayer() {
        if (!doc) return;

        const newLayer = createLayer("canvas", `Layer ${doc.layers.length + 1}`);
        doc.layers = [...doc.layers, newLayer];
    }

    function removeLayer(layerId: LayerID) {
        if (!doc) return;
        doc.layers = doc.layers.filter(layer => layer.id !== layerId);
        if (ui.selectedLayers[doc.id].includes(layerId)) {
            ui.selectedLayers[doc.id] = ui.selectedLayers[doc.id].filter(id => id !== layerId);
        }
    }

    function selectLayer(layerId: LayerID) {
        if (!doc) return;
        ui.selectedLayers[doc.id] = [layerId];
    }

    let layerBeingRenamed: LayerID | null = $state(null);

    function renameLayer(layerId: LayerID) {
        layerBeingRenamed = layerId;
    }

    function toggleLayerVisibility(layer: Layer) {
        layer.visible = !layer.visible;
    }

    function handleDragover(event: DragEvent) {
        event.preventDefault();
        if (!layersRect) return;
        const layersElement = document.getElementById('layers')!;
        const scrollTop = layersElement.scrollTop;
        const yWithinLayers = scrollTop + (event.clientY - layersRect.top);
        const uncappedIndex = Math.floor(yWithinLayers / interLayerDiff);
        shadowLayerIndex = Math.max(0, Math.min(uncappedIndex, layerDisplayList.length));
    }

    function updateLayerOrder() {
        if (doc)
            doc.layers = layerDisplayList;
    }

    function handleDragEnd() {
        window.clearInterval(updateLayerInterval);
        updateLayerOrder();
        layerBeingDragged = null;
        shadowLayerIndex = null;
    }

    let layerBeingDragged: Layer | null = $state(null);
    let shadowLayerIndex: number | null = $state(null);
    let layersRect: DOMRect | null = $state(null);
    let interLayerDiff: number = $state(1);
    let updateLayerInterval: number = $state(-1);

    function handleDragStart(event: DragEvent, layer: Layer, index: number) {
        if (!doc || doc.layers.length < 2) event.preventDefault();
        layerBeingDragged = layer;
        shadowLayerIndex = index;
        const layersElement = document.getElementById('layers');
        layersRect = layersElement?.getBoundingClientRect() ?? null;
        const layer1Rect = layersElement?.children[0]?.getBoundingClientRect();
        const layer2Rect = layersElement?.children[1]?.getBoundingClientRect();
        if (layer1Rect && layer2Rect)
            interLayerDiff = layer2Rect.top - layer1Rect.top;
        updateLayerInterval = window.setInterval(updateLayerOrder, 50);
    }

    let layerDisplayList = $derived.by(() => {
        if (!doc) return [];
        if (!layerBeingDragged || shadowLayerIndex === null) return doc.layers;
        const draggedId = layerBeingDragged.id;
        const allButDragged = doc.layers.filter(l => l.id !== draggedId);
        return [
            ...allButDragged.slice(0, shadowLayerIndex),
            layerBeingDragged,
            ...allButDragged.slice(shadowLayerIndex)
        ];
    });
</script>

<Panel title="Layers" scrollable>
    <div id="layers"
         ondragover={handleDragover}
         ondrop={(e) => e.preventDefault()}
         role="application"
    >
        {#if !doc}
            <div>No document selected</div>
        {:else}
            {#each layerDisplayList as layer, index}
                <div
                    class="layer"
                    style:opacity="{layer.id !== layerBeingDragged?.id ? 1 : 0.6}"
                    class:selected={ui.selectedLayers[doc.id]?.includes(layer.id)}
                    draggable="true"
                    ondragstart={(event) => handleDragStart(event, layer, index)}
                    ondragend={handleDragEnd}
                    role="application"
                >
                    <button
                        class="preview"
                        onclick={() => selectLayer(layer.id)}
                        ondblclick={() => renameLayer(layer.id)}
                    >
                        {#if layer.type === 'canvas'}
                            <Image size={16} />
                        {:else}
                            <Type size={16} />
                        {/if}
                        {#if layerBeingRenamed === layer.id}
                            <Input
                                    placeholder="Layer name"
                                    name="layer-name"
                                    bind:value={layer.name}
                                    onBlur={() => layerBeingRenamed = null}
                            ><div></div></Input>
                        {:else}
                            <div class="name">{layer.name}</div>
                        {/if}
                    </button>
                    <button onclick={() => toggleLayerVisibility(layer)}>
                        <IconButtonVisual label="{layer.visible ? 'Hide' : 'Show'} Layer {layer.name}">
                            {#if layer.visible}
                                <EyeOff size={16} />
                            {:else}
                                <Eye size={16} />
                            {/if}
                        </IconButtonVisual>
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
            <button id="add-layer" disabled={!doc} onclick={addLayer}>
                <ButtonVisual size="small" style="subtle" width="full" disabled={!doc}>
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
        width: 100%;
    }

    .layer.selected {
        background-color: var(--c-acc);
    }

    .layer button {
        flex-shrink: 0;
    }

    .preview {
        display: flex;
        justify-content: flex-start;
        flex: 1;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        align-items: center;
        gap: var(--s-xs);
    }

    .name {
        flex-shrink: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-grow: 1;
        text-align: left;
    }
</style>