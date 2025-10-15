import type { Layer, LayerID } from "./layer";
import type { DocumentID } from "./docs.svelte";
import docs from "./docs.svelte";

/**
 * An action represents a change made to a layer. It stores
 * the old state and new state of the layer. Used for undo/redo
 * functionality.
 */
export interface Action {
    layerID: LayerID;
    oldLayer: Layer | null;
    newLayer: Layer | null;
}

const actions: Record<DocumentID, Action[]> = {};
const snapshots: Record<LayerID, Layer | null> = {};
const currentActionIndex: Record<DocumentID, number> = {};

/**
 * Completes an action by storing the new state of the layer.
 * Unmarks the layer as performing an action.
 * @param layerID 
 * @param newLayer 
 * @param documentId 
 * @returns 
 */
export function postAction(layerID: LayerID, newLayer: Layer | null) {
    if (!docs.selected) return;
    const documentId = docs.selected.id;

    // make deep copy of new layer
    const newLayerCopy = newLayer ? deepCopyLayer(newLayer) : null;

    // mske sure an actions array and current action index exists for this document
    if (!actions[documentId]) actions[documentId] = [];
    if (currentActionIndex[documentId] === undefined) currentActionIndex[documentId] = -1;

    // remove any actions after the current action index
    actions[documentId] = actions[documentId].slice(0, currentActionIndex[documentId] + 1);

    // add the action to the actions array and increment the current action index
    actions[documentId].push({
        layerID,
        oldLayer: snapshots[layerID] ?? null,
        newLayer: newLayerCopy
    });
    currentActionIndex[documentId]++;

    // update the snapshot
    snapshots[layerID] = newLayerCopy;
}

/**
 * Deep copies a layer. For canvas layers, creates a new OffscreenCanvas and copies the contents.
 * Returns a shallow copy of any other layer properties.
 * @param layer 
 * @returns 
 */
function deepCopyLayer(layer: Layer): Layer {
    const layerCopy = { ...layer };

    if (layer.type === 'canvas') {
        // create a new OffscreenCanvas and copy the contents
        const canvasCopy = new OffscreenCanvas(layer.canvas.width, layer.canvas.height);
        const ctx = canvasCopy.getContext('2d');
        if (ctx) {
            ctx.drawImage(layer.canvas, 0, 0);
        }
        layer.canvas = canvasCopy;
    }

    // copy the layer transform
    layerCopy.transform = { ...layer.transform };
    layerCopy.transform.matrix = layer.transform.matrix.translate(0, 0);

    return layerCopy;
}

export function undoAction(documentId: DocumentID): Action | null {
    const a = actions[documentId];
    const index = currentActionIndex[documentId];

    // make sure there is an action to undo
    if (a && index >= 0) {
        currentActionIndex[documentId]--;
        return a[index];
    }
    return null;
}

export function redoAction(documentId: DocumentID): Action | null {
    const a = actions[documentId];
    const index = currentActionIndex[documentId];

    // make sure there is an action to redo
    if (a && index < a.length - 1) {
        currentActionIndex[documentId]++;
        return a[index+1];
    }
    return null;
}