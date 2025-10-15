import type { Layer, LayerID } from "./layer";
import type { DocumentID } from "./docs.svelte";

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
const currentActionIndex: Record<DocumentID, number> = {};
let layersPerformingAction: LayerID[] = [];

/**
 * Prepares an action by storing the old state of the layer.
 * Marks the layer as performing an action to prevent concurrent modifications.
 * @param layerID 
 * @param oldLayer 
 * @param documentId 
 * @returns 
 */
export function preAction(layerID: LayerID, oldLayer: Layer | null, documentId: DocumentID) {
    // check if layer is already performing an action
    if (oldLayer && layersPerformingAction.includes(layerID)) {
        console.warn('Layer is already performing an action');
        return;
    }

    // create action array or current action index for document if it doesn't exist
    if (actions[documentId] === undefined) {
        actions[documentId] = [];
    }

    if (currentActionIndex[documentId] === undefined) {
        currentActionIndex[documentId] = -1;
    }

    // increment current action index and remove any actions after it
    currentActionIndex[documentId]++;
    actions[documentId] = actions[documentId].slice(0, currentActionIndex[documentId]);

    // make deep copy of layer
    const oldLayerCopy = oldLayer ? deepCopyLayer(oldLayer) : null;

    // add action to actions array
    actions[documentId].push({
        layerID,
        oldLayer: oldLayerCopy,
        newLayer: null,
    });

    // mark layer as performing an action
    layersPerformingAction.push(layerID);
}

/**
 * Completes an action by storing the new state of the layer.
 * Unmarks the layer as performing an action.
 * @param layerID 
 * @param newLayer 
 * @param documentId 
 * @returns 
 */
export function postAction(layerID: LayerID, newLayer: Layer | null, documentId: DocumentID) {
    // make sure layer is performing an action
    if (!layersPerformingAction.includes(layerID)) {
        console.warn('Layer is not performing an action');
        return;
    }

    const a = actions[documentId];

    // find most recent action for this layer
    let action: Action | null = null;
    for (let i = a.length - 1; i >= 0; i--) {
        if (a[i].layerID === layerID && a[i].newLayer === null) {
            action = a[i];
            break;
        }
    }

    if (!action) {
        console.warn('No action found for layer');
        return;
    }

    // make deep copy of new layer
    const newLayerCopy = newLayer ? deepCopyLayer(newLayer) : null;

    // update action with new layer
    action.newLayer = newLayerCopy;

    // unmark layer as performing an action
    layersPerformingAction = layersPerformingAction.filter(id => id !== layerID);
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