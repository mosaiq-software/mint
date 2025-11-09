import {type Layer, type LayerID} from "./layer";
import docs from "./docs.svelte";
import {deepCopyLayer, postAction} from "./action";
import ui from "./ui.svelte";

export let clipboard: {layer: Layer | null} = $state({layer: null});

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