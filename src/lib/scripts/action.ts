import type { Layer, LayerID } from "./layer";
import type { DocumentID, Document } from "./docs.svelte";
import docs, { matrixToTransformComponents } from "./docs.svelte";
import ui, { setPreviousRotation, type Bounds } from "./ui.svelte";
import tabStatus from "./tabStatus.svelte.js";

/* Types */

/**
 * An action that creates a new layer.
 */
type CreateAction = {
    type: 'create';
    layer: Layer;
    position: number;
}

/**
 * An action that deletes a layer.
 */
type DeleteAction = {
    type: 'delete';
    layer: Layer;
    position: number;
}

/**
 * An action that transforms a layer.
 */
type TransformAction = {
    type: 'transform';
    layerID: LayerID;
    oldMatrix: DOMMatrix;
    newMatrix: DOMMatrix;
    oldBounds: Bounds | null;
    newBounds: Bounds | null;
}

/**
 * An action that changes the canvas content of a layer.
 */
type ContentAction = {
    type: 'content';
    layerID: LayerID;
    oldContent: ImageData;
    newContent: ImageData;
}

/**
 * An action that updates properties of a layer.
 */
type UpdateAction = {
    type: 'update';
    layerID: LayerID;
    oldLayer: Partial<Layer>;
    newLayer: Partial<Layer>;
}

/**
 * An action that reorders a layer within the document's layer stack.
 */
type ReorderAction = {
    type: 'reorder';
    layerID: LayerID;
    oldPosition: number;
    newPosition: number;
}

/**
 * An action that updates properties of a document.
 */
type DocumentAction = {
    type: 'document';
    oldDocument: Partial<Document> & {id: DocumentID};
    newDocument: Partial<Document> & {id: DocumentID};
}

/**
 * A compound action that groups multiple actions together.
 */
type CompoundAction = {
    type: 'compound',
    actions: (Action | null)[]
}

/**
 * An action represents a change made to a layer. It stores
 * the old state and new state of the layer. Used for undo/redo
 * functionality.
 */
export type Action = CreateAction
    | DeleteAction
    | TransformAction
    | ContentAction
    | UpdateAction
    | ReorderAction
    | DocumentAction
    | CompoundAction;

/**
 * An action that creates a new layer.
 */
type CreatePostAction = CreateAction;

/**
 * An action that deletes a layer.
 */
type DeletePostAction = DeleteAction;

/**
 * An action that transforms a layer.
 */
type TransformPostAction = {
    type: 'transform';
    layerID: LayerID;
    newMatrix: DOMMatrix;
    newBounds: Bounds | null;
}

/**
 * An action that changes the canvas content of a layer.
 */
type ContentPostAction = {
    type: 'content';
    layerID: LayerID;
    newContent: ImageData;
}

/**
 * An action that updates properties of a layer.
 */
type UpdatePostAction = {
    type: 'update';
    layerID: LayerID;
    newLayer: Partial<Layer>;
}

/**
 * An action that reorders a layer within the document's layer stack.
 */
type ReorderPostAction = ReorderAction;

/**
 * An action that updates properties of a document.
 */
type DocumentPostAction = DocumentAction;

/**
 * A compound action that groups multiple actions together.
 */
type CompoundPostAction = {
    type: 'compound',
    actions: PostAction[]
}

/**
 * A PostAction is similar to an Action, but only stores the new state of the layer.
 * Used for creating new actions, as the old state is captured via snapshots.
 */
export type PostAction = CreatePostAction
    | DeletePostAction
    | TransformPostAction
    | ContentPostAction
    | UpdatePostAction
    | ReorderPostAction
    | DocumentPostAction
    | CompoundPostAction;

/* State */

/** Stores all actions for each document. */
const actions: Record<DocumentID, Action[]> = {};

/** Stores snapshots of layers before actions are applied. */
const snapshots: Record<LayerID, Layer | null> = {};

/** Stores bounding box snapshots for each document. */
const bounds: Record<DocumentID, Bounds | null> = {};

/** Stores the current action index for each document. */
const currentActionIndex: Record<DocumentID, number> = {};

/* Functions */

/**
 * Converts a PostAction to a complete Action by retrieving the old state from snapshots.
 * @param postAction A PostAction representing a change made to a layer.
 * @returns A complete Action with old and new states, or null if conversion fails.
 */
function postActionToAction(postAction: PostAction): Action | null {
    let action: Action;
    if (postAction.type === 'create') {
        action = {
            type: 'create',
            layer: postAction.layer,
            position: postAction.position
        };
    } else if (postAction.type === 'delete') {
        action = {
            type: 'delete',
            layer: postAction.layer,
            position: postAction.position
        };
    } else if (postAction.type === 'transform') {
        const snapshot = snapshots[postAction.layerID];
        if (!snapshot) return null;
        const oldBounds = docs.selected ? bounds[docs.selected.id] ?? null : null;
        action = {
            type: 'transform',
            layerID: postAction.layerID,
            oldMatrix: snapshot.transform.matrix,
            newMatrix: postAction.newMatrix,
            oldBounds: oldBounds ? {
                pos: { ...oldBounds.pos },
                size: { ...oldBounds.size },
                rot: oldBounds.rot
            } : null,
            newBounds: postAction.newBounds ? {
                pos: { ...postAction.newBounds.pos },
                size: { ...postAction.newBounds.size },
                rot: postAction.newBounds.rot
            } : null
        };
    } else if (postAction.type === 'content') {
        const snapshot = snapshots[postAction.layerID];
        if (!snapshot || snapshot.type !== 'canvas') return null;
        action = {
            type: 'content',
            layerID: postAction.layerID,
            oldContent: snapshot.canvas.getContext('2d')!.getImageData(0, 0, snapshot.canvas.width, snapshot.canvas.height),
            newContent: postAction.newContent
        };
    } else if (postAction.type === 'update') {
        const snapshot = snapshots[postAction.layerID];
        if (!snapshot) return null;

        const oldLayer: Partial<Record<keyof Layer, Layer[keyof Layer]>> = {};
        for (const key in postAction.newLayer) {
            const k = key as keyof Layer;
            oldLayer[k] = snapshot[k];
        }

        action = {
            type: 'update',
            layerID: postAction.layerID,
            oldLayer: oldLayer as Partial<Layer>,
            newLayer: postAction.newLayer
        }
    } else if (postAction.type === 'reorder') {
        action = {
            type: 'reorder',
            layerID: postAction.layerID,
            oldPosition: postAction.oldPosition,
            newPosition: postAction.newPosition
        };
    } else if (postAction.type === 'document') {
        action = {
            type: 'document',
            oldDocument: postAction.oldDocument,
            newDocument: postAction.newDocument
        };
    } else if (postAction.type === 'compound') {
        action = {
            type: 'compound',
            actions: postAction.actions.map(postActionToAction)
        }
    } else {
        console.warn('Unknown postAction type:', postAction);
        return null;
    }
    return action;
}

/**
 * Adds a new action to the action stack for the currently selected document.
 * @param postAction A PostAction representing a change made to a layer.
 */
export function postAction(postAction: PostAction) {
    if (!docs.selected) return;
    const documentId = docs.selected.id;

    // mske sure an actions array and current action index exists for this document
    if (!actions[documentId]) actions[documentId] = [];
    if (currentActionIndex[documentId] === undefined) currentActionIndex[documentId] = -1;

    // remove any actions after the current action index
    actions[documentId] = actions[documentId].slice(0, currentActionIndex[documentId] + 1);

    let action = postActionToAction(postAction);
    if (!action) return;

    // add the action to the actions array and increment the current action index
    actions[documentId].push(action);
    currentActionIndex[documentId]++;

    // limit the number of actions to 50
    if (currentActionIndex[documentId] >= 50) {
        actions[documentId].shift();
        currentActionIndex[documentId]--;
    }

    // update the snapshot for the layer
    updateSnapshot(action, 'redo');

    // update the bounds snapshot
    updateBoundsSnapshot(documentId, ui.selected?.bounds ?? null);

    // indicate unsaved changes
    tabStatus[documentId].actionsSinceSave++;
    tabStatus[documentId].canUndo = true;
    tabStatus[documentId].canRedo = currentActionIndex[documentId] < actions[documentId].length - 2;
}

/**
 * Deep copies a layer. For canvas layers, creates a new OffscreenCanvas and copies the contents.
 * Copies the layer transform object and matrix. Returns a shallow copy for other properties.
 * @param layer 
 * @returns 
 */
export function deepCopyLayer(layer: Layer): Layer {
    const layerCopy: Layer = { ...layer};

    if (layerCopy.type === 'canvas' && layer.type === 'canvas') {
        const canvasCopy = new OffscreenCanvas(layer.canvas.width, layer.canvas.height);
        const ctx = canvasCopy.getContext('2d');
        if (ctx) ctx.drawImage(layer.canvas, 0, 0);
        layerCopy.canvas = canvasCopy;
    }

    layerCopy.transform = { ...layer.transform };
    layerCopy.transform.matrix = layer.transform.matrix.translate(0, 0);

    return layerCopy;
}

/**
 * Returns the next action to be undone, if it exists.
 * @param documentId The ID of the document to get the undo action for.
 * @returns The action to be undone, or null if no action to undo.
 */
export function getUndoAction(documentId: DocumentID): Action | null {
    const a = actions[documentId];
    let index = currentActionIndex[documentId];

    if (a && index >= 0) {
        const action = a[index];
        currentActionIndex[documentId] = index - 1;
        tabStatus[documentId].actionsSinceSave--;
        tabStatus[documentId].canRedo = true;
        tabStatus[documentId].canUndo = index > 0;
        return action;
    }
    return null;
}

/**
 * Returns the next action to be redone, if it exists.
 * @param documentId The ID of the document to get the redo action for.
 * @returns The action to be redone, or null if no action to redo.
 */
export function getRedoAction(documentId: DocumentID): Action | null {
    const a = actions[documentId];
    let index = currentActionIndex[documentId];

    if (a && index < a.length - 1) {
        index = index + 1;
        const action = a[index];
        tabStatus[documentId].actionsSinceSave++;
        currentActionIndex[documentId] = index;
        tabStatus[documentId].canUndo = true;
        tabStatus[documentId].canRedo = index < a.length - 2;
        return action;
    }
    return null;
}

/**
 * Updates the snapshot for a layer based on the action type and whether it's an undo or redo.
 * @param action The action to update the snapshot for.
 * @param type `'undo'` or `'redo'` to indicate which state to use for the snapshot.
 */
export function updateSnapshot(action: Action, type: 'undo' | 'redo') {
    // update the bounds snapshot
    if (action.type === 'transform') {
        if (type === 'undo') {
            updateBoundsSnapshot(docs.selected!.id, action.oldBounds);
        } else {
            updateBoundsSnapshot(docs.selected!.id, action.newBounds);
        }
    } else {
        updateBoundsSnapshot(docs.selected!.id, ui.selected?.bounds ?? null);
    }

    // update the layer snapshot
    if (action.type === 'create') {
        if (type === 'undo') {
            delete snapshots[action.layer.id];
        } else {
            snapshots[action.layer.id] = deepCopyLayer(action.layer);
        }
    } else if (action.type === 'delete') {
        if (type === 'undo') {
            snapshots[action.layer.id] = deepCopyLayer(action.layer);
        } else {
            delete snapshots[action.layer.id];
        }
    } else if (action.type === 'transform') {
        const layer = snapshots[action.layerID];
        if (layer) {
            layer.transform.matrix = type === 'undo'
                ? action.oldMatrix
                : action.newMatrix;
            if (docs.selected?.layers.find(l => l.id === action.layerID)) {
                (docs.selected.layers.find(l => l.id === action.layerID) as Layer).transform.matrix = type === 'undo'
                    ? action.oldMatrix
                    : action.newMatrix;
            }
        }
    } else if (action.type === 'content') {
        const layer = snapshots[action.layerID];
        if (layer && layer.type === 'canvas') {
            const canvas = new OffscreenCanvas(layer.canvas.width, layer.canvas.height);
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.putImageData(
                    type === 'undo' ? action.oldContent : action.newContent,
                    0, 0
                );
                layer.canvas = canvas;
            }
        }
    } else if (action.type === 'update') {
        const layer = snapshots[action.layerID];
        if (layer) {
            const changes = type === 'undo' ? action.oldLayer : action.newLayer;
            Object.assign(layer, changes);
        }
    } else if (action.type === 'compound') {
        action.actions.forEach(a => {
            if (a) updateSnapshot(a, type);
        });
    }
}

/**
 * Updates the bounds snapshot for a document.
 * @param documentId The ID of the document to update bounds snapshot for.
 * @param newBounds The new bounds to snapshot, or null to clear.
 */
export function updateBoundsSnapshot(documentId: DocumentID, newBounds: Bounds | null) {
    if (newBounds === null) {
        bounds[documentId] = null;
        return;
    } else {
        bounds[documentId] = {
            pos: { ...newBounds.pos },
            size: { ...newBounds.size },
            rot: newBounds.rot
        };
    }
}

/**
 * Applies an undo action to the document.
 * @param action The action to be undone.
 */
export function applyUndoAction(action: Action) {
    if (!docs.selected) return;

    if (action.type === 'create') {
        // layer was created, so remove it from document
        docs.selected.layers = docs.selected.layers.filter(l => l.id !== action.layer.id);
        if (ui.selected) ui.selected.selectedLayers = ui.selected.selectedLayers.filter(id => id !== action.layer.id);
    } else if (action.type === 'delete') {
        // layer was deleted, so add it back to document at action.position
        if (action.position !== undefined) {
            docs.selected.layers.splice(action.position, 0, deepCopyLayer(action.layer));
        } else {
            docs.selected.layers.push(deepCopyLayer(action.layer));
        }
    } else if (action.type === 'transform') {
        // layer was transformed, so revert to oldLayer state
        const layer = docs.selected.layers.find(l => l.id === action.layerID);
        if (layer) {
            layer.transform.matrix = action.oldMatrix;
        }
        applyBounds(action.oldBounds);
    } else if (action.type === 'content') {
        // layer content was changed, so revert to oldContent
        const layer = docs.selected.layers.find(l => l.id === action.layerID);
        if (layer && layer.type === 'canvas') {
            const ctx = layer.canvas.getContext('2d');
            if (ctx) {
                ctx.putImageData(action.oldContent, 0, 0);
            }
        }
    } else if (action.type === 'update') {
        // layer was updated, so revert to oldLayer state
        const layerIndex = docs.selected.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            const layer = docs.selected.layers[layerIndex];
            if (layer) {
                Object.assign(layer, action.oldLayer);
            }
        }
    } else if (action.type === 'reorder') {
        // layer was reordered, so move it back to oldPosition
        const layerIndex = docs.selected.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            const [layer] = docs.selected.layers.splice(layerIndex, 1);
            docs.selected.layers.splice(action.oldPosition, 0, layer);
        }
    } else if (action.type === 'document') {
        const id = action.oldDocument.id;
        Object.assign(docs[id], action.oldDocument);
    } else if (action.type === 'compound') {
        action.actions.forEach(a => {
            if (a) applyUndoAction(a);
        });
    }

    // force re-render
    docs.selected.layers = [...docs.selected.layers];
}

/**
 * Update the bounding box according to the new bounds and the
 * number of selected layers.
 * @param newBounds The new bounds to apply to the selected layers.
 */
function applyBounds(newBounds: Bounds | null) {
    if (!ui.selected) return;

    if (newBounds === null) {
        ui.selected.bounds = null;
        return;
    }

    if (ui.selected.bounds === null) return;

    if (ui.selectedLayers.length === 0) {
        return;
    } else if (ui.selectedLayers.length === 1) {
        // single layer, apply rotation of layer
        const m = matrixToTransformComponents(ui.selectedLayers[0].transform.matrix);
        setPreviousRotation(m.rotate);
        ui.selected.bounds.rot = m.rotate;
    } else {
        // multiple layers, set rotation to bounds rotation
        setPreviousRotation(newBounds.rot);
        ui.selected.bounds.rot = newBounds.rot;
    }
}

/**
 * Applies a redo action to the document.
 * @param action 
 * @returns 
 */
export function applyRedoAction(action: Action) {
    if (!docs.selected) return;

    if (action.type === 'create') {
        // layer was created, so add it back to document at action.position
        if (action.position !== undefined) {
            docs.selected.layers.splice(action.position, 0, deepCopyLayer(action.layer));
        } else {
            docs.selected.layers.push(deepCopyLayer(action.layer));
        }
    } else if (action.type === 'delete') {
        // layer was deleted, so remove it from document
        docs.selected.layers = docs.selected.layers.filter(l => l.id !== action.layer.id);
        if (ui.selected) ui.selected.selectedLayers = ui.selected.selectedLayers.filter(id => id !== action.layer.id);
    } else if (action.type === 'transform') {
        // layer was transformed, so apply newLayer state
        const layer = docs.selected.layers.find(l => l.id === action.layerID);
        if (layer) {
            layer.transform.matrix = action.newMatrix;
        }
        applyBounds(action.newBounds);
    } else if (action.type === 'content') {
        // layer content was changed, so apply newContent
        const layer = docs.selected.layers.find(l => l.id === action.layerID);
        if (layer && layer.type === 'canvas') {
            const ctx = layer.canvas.getContext('2d');
            if (ctx) {
                ctx.putImageData(action.newContent, 0, 0);
            }
        }
    } else if (action.type === 'update') {
        // layer was updated, so apply newLayer state
        const layerIndex = docs.selected.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            const layer = docs.selected.layers[layerIndex];
            if (layer) {
                Object.assign(layer, action.newLayer);
            }
        }
    } else if (action.type === 'reorder') {
        // layer was reordered, so move it to newPosition
        const layerIndex = docs.selected.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            const [layer] = docs.selected.layers.splice(layerIndex, 1);
            docs.selected.layers.splice(action.newPosition, 0, layer);
        }
    } else if (action.type === 'document') {
        const id = action.oldDocument.id;
        Object.assign(docs[id], action.newDocument);
    } else if (action.type === 'compound') {
        action.actions.forEach(a => {
            if (a) applyRedoAction(a);
        });
    }

    // force re-render
    docs.selected.layers = [...docs.selected.layers];
}

/**
 * Populates the snapshots object with deep copies of the given layers.
 * @param layers 
 */
export function populateSnapshots(layers: Layer[]) {
    for (const layer of layers) {
        snapshots[layer.id] = deepCopyLayer(layer);
    }
}