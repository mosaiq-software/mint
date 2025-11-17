import { type Layer, type LayerID } from "./layer";
import docs from "./docs.svelte";
import { deepCopyLayer, postAction, type PostAction } from "./action";
import ui from "./ui.svelte";

export let clipboard: {layers: Layer[]} = $state({layers: []});

export function copyLayersToClipboard() {
    if (ui.selectedLayers.length === 0) return;
    clipboard.layers = ui.selectedLayers.map(layer => deepCopyLayer(layer));
}

export function pasteLayersFromClipboard() {
    if (!docs.selected || clipboard.layers.length === 0) return;

    if (ui.selected) ui.selected.selectedLayers = [];
    const actions: PostAction[] = [];
    for (const layer of clipboard.layers) {
        const name = `Copy of ${layer.name}`;
        const id: LayerID = `layer-${crypto.randomUUID()}` as LayerID;
        const newLayer = {
            ...deepCopyLayer(layer),
            name,
            id
        };
        docs.selected.layers.push(newLayer);
        ui.selected?.selectedLayers.push(id);
        actions.push({
            type: "create",
            layer: newLayer,
            position: docs.selected.layers.length - 1
        });
    }

    postAction({
        type: "compound",
        actions
    });
}