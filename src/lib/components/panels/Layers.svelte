<script lang="ts">
    import Panel from "./Panel.svelte";
    import docs from "../../scripts/docs.svelte";
    import { ButtonVisual } from "../ui";
    import IconButtonVisual from "../ui/IconButtonVisual.svelte";
    import { Plus, X, Eye, EyeOff, Type, Image, Square, Circle } from "@lucide/svelte";
    import { createLayer, type LayerID, type Layer } from "../../scripts/layer";
    import ui from "../../scripts/ui.svelte";
    import Input from "../ui/Input.svelte";
    import { postAction } from "../../scripts/action";

    function addLayer() {
        if (!docs.selected) return;

        const newLayer = createLayer("canvas", `Layer ${docs.selected.layers.length + 1}`);
        docs.selected.layers = [...docs.selected.layers, newLayer];

        postAction({
            type: "create",
            layer: newLayer,
            position: docs.selected.layers.length - 1
        })
    }

    function removeLayer(layerId: LayerID) {
        if (!docs.selected) return;
        const layer = docs.selected.layers.find(layer => layer.id === layerId);
        if (!layer) return;

        const layerPosition = docs.selected.layers.findIndex(layer => layer.id === layerId);

        docs.selected.layers = docs.selected.layers.filter(layer => layer.id !== layerId);
        if (ui.selected?.selectedLayers.includes(layerId)) {
            ui.selected.selectedLayers = ui.selected.selectedLayers.filter(id => id !== layerId);
        }

        postAction({
            type: "delete",
            layer: layer,
            position: layerPosition
        });
    }

    function selectLayer(e: MouseEvent, layerId: LayerID) {
        if (!ui.selected) return;

        if (e.shiftKey) {
            // toggle visibility
            if (ui.selected.selectedLayers.includes(layerId)) {
                ui.selected.selectedLayers = ui.selected.selectedLayers.filter(id => id !== layerId);
            } else {
                ui.selected.selectedLayers = [...ui.selected.selectedLayers, layerId];
            }
        } else {
            // single select
            ui.selected.selectedLayers = [layerId]
        }
    }

    let layerBeingRenamed: LayerID | null = $state(null);
    let startingIndex: number = -1;

    function renameLayer(layerId: LayerID) {
        layerBeingRenamed = layerId;
    }

    function handleRenameBlur() {
        if (!layerBeingRenamed || !docs.selected) return;
        const layer = docs.selected.layers.find(l => l.id === layerBeingRenamed);
        if (!layer) return;

        layerBeingRenamed = null;

        if (layer.name.trim() === "") {
            layer.name = "Layer";
        }

        postAction({
            type: "update",
            layerID: layer.id,
            newLayer: { name: layer.name }
        });
    }

    function toggleLayerVisibility(layer: Layer) {
        layer.visible = !layer.visible;

        postAction({
            type: "update",
            layerID: layer.id,
            newLayer: { visible: layer.visible }
        });
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
        if (docs.selected) docs.selected.layers = layerDisplayList;
    }

    function handleDragEnd() {
        window.clearInterval(updateLayerInterval);

        if (docs.selected) {
            const newLayerPosition = layerDisplayList.findIndex(l => l.id === layerBeingDragged?.id);
            postAction({
                type: 'reorder',
                layerID: layerBeingDragged!.id,
                oldPosition: startingIndex,
                newPosition: newLayerPosition
            });
        }

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
        layerBeingDragged = layer;
        shadowLayerIndex = index;
        const layersElement = document.getElementById('layers');
        layersRect = layersElement?.getBoundingClientRect() ?? null;
        const layer1Rect = layersElement?.children[0]?.getBoundingClientRect();
        const layer2Rect = layersElement?.children[1]?.getBoundingClientRect();
        if (layer1Rect && layer2Rect)
            interLayerDiff = layer2Rect.top - layer1Rect.top;
        updateLayerInterval = window.setInterval(updateLayerOrder, 50);
        startingIndex = index;
    }

    let layerDisplayList = $derived.by(() => {
        if (!docs.selected) return [];
        if (!layerBeingDragged || shadowLayerIndex === null) return docs.selected.layers;
        const draggedId = layerBeingDragged.id;
        const allButDragged = docs.selected.layers.filter(l => l.id !== draggedId);
        return [
            ...allButDragged.slice(0, shadowLayerIndex),
            layerBeingDragged,
            ...allButDragged.slice(shadowLayerIndex)
        ];
    });
</script>

<Panel title="Layers">
    <div id="layers"
         ondragover={handleDragover}
         ondrop={(e) => e.preventDefault()}
         role="application"
    >
        {#if !docs.selected}
            <div>No document selected</div>
        {:else}
            {#each layerDisplayList as layer, index}
                <div
                    class="layer"
                    style:opacity="{layer.id !== layerBeingDragged?.id ? 1 : 0.6}"
                    class:selected={ui.selected?.selectedLayers.includes(layer.id)}
                    draggable={docs.selected?.layers.length >= 2 && layer.id !== layerBeingRenamed ? 'true' : undefined}
                    ondragstart={(event) => handleDragStart(event, layer, index)}
                    ondragend={handleDragEnd}
                    role="application"
                >
                    <button
                        class="preview"
                        onclick={(e) => selectLayer(e, layer.id)}
                        ondblclick={() => renameLayer(layer.id)}
                    >
                        {#if layer.type === 'canvas'}
                            <Image size={16} />
                        {:else if layer.type === 'text'}
                            <Type size={16} />
                        {:else if layer.type === 'rectangle'}
                            <Square size={16} />
                        {:else if layer.type === 'ellipse'}
                            <Circle size={16} />
                        {/if}
                        {#if layerBeingRenamed === layer.id}
                            <Input
                                    placeholder="Layer name"
                                    name="layer-name"
                                    bind:value={layer.name}
                                    onBlur={handleRenameBlur}
                            ><div></div></Input>
                        {:else}
                            <div class="name">{layer.name}</div>
                        {/if}
                    </button>
                    <button onclick={() => toggleLayerVisibility(layer)}>
                        <IconButtonVisual label="{layer.visible ? 'Hide' : 'Show'} Layer {layer.name}">
                            {#if layer.visible}
                                <Eye size={16} />
                            {:else}
                                <EyeOff size={16} />
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
        max-height: 200px;
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