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

    // create action array for document if it doesn't exist
    const a = actions[documentId];
    if (!a) {
        actions[documentId] = [];
    }

    // make deep copy of layer
    const oldLayerCopy = oldLayer ? deepCopyLayer(oldLayer) : null;

    // add action to actions array
    a.push({
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
    if (layer.type === 'canvas') {
        // create a new OffscreenCanvas and copy the contents
        const canvasCopy = new OffscreenCanvas(layer.canvas.width, layer.canvas.height);
        const ctx = canvasCopy.getContext('2d');
        if (ctx) {
            ctx.drawImage(canvasCopy, 0, 0);
        }

        // return new layer with copied canvas, but shallow copy other properties
        return { ...layer, canvas: canvasCopy };
    } else {
        // for other layer types, return a shallow copy
        return { ...layer };
    }
}