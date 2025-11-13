import {type Layer, type LayerID} from "./layer";
import docs from "./docs.svelte";
import {deepCopyLayer, postAction} from "./action";
import ui from "./ui.svelte";

/**
 * Stores the clipboard data for copy-paste operations.
 * Currently holds a single layer that can be pasted.
 */
let clipboard: {layer: Layer | null} = $state({layer: null});

/**
 * Copies the given layer to the clipboard.
 * @param layer The layer to copy to the clipboard.
 */
export function copyLayerToClipboard(layer: Layer) {
    clipboard.layer = layer;
}

/**
 * Pastes the layer stored in the clipboard into the currently selected document.
 */
export function pasteLayerFromClipboard() {
    if (!docs.selected || !clipboard.layer) return;
    const name = `Copy of ${clipboard.layer.name}`;
    const id: LayerID = `layer-${crypto.randomUUID()}` as LayerID;
    const layer = {
        ...deepCopyLayer(clipboard.layer),
        name,
        id
    };
    docs.selected.layers.push(layer);
    if (ui.selected) ui.selected.selectedLayers = [id];
    postAction({
        type: "create",
        layer: layer,
        position: docs.selected.layers.length - 1
    });
}