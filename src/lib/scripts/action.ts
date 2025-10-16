import type { Layer, LayerID } from "./layer";
import type { DocumentID } from "./docs.svelte";
import docs from "./docs.svelte";

type CreateAction = {
    type: 'create';
    layer: Layer;
    position: number;
}

type DeleteAction = {
    type: 'delete';
    layer: Layer;
    position: number;
}

type TransformAction = {
    type: 'transform';
    layerID: LayerID;
    oldMatrix: DOMMatrix;
    newMatrix: DOMMatrix;
}

type ContentAction = {
    type: 'content';
    layerID: LayerID;
    oldContent: ImageData;
    newContent: ImageData;
}

type UpdateAction = {
    type: 'update';
    layerID: LayerID;
    oldLayer: Partial<Layer>;
    newLayer: Partial<Layer>;
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
    | UpdateAction;

type CreatePostAction = CreateAction;

type DeletePostAction = DeleteAction;

type TransformPostAction = {
    type: 'transform';
    layerID: LayerID;
    newMatrix: DOMMatrix;
}

type ContentPostAction = {
    type: 'content';
    layerID: LayerID;
    newContent: ImageData;
}

type UpdatePostAction = {
    type: 'update';
    layerID: LayerID;
    newLayer: Partial<Layer>;
}

/**
 * A PostAction is similar to an Action, but only stores the new state of the layer.
 * Used for creating new actions, as the old state is captured via snapshots.
 */
export type PostAction = CreatePostAction
    | DeletePostAction
    | TransformPostAction
    | ContentPostAction
    | UpdatePostAction;

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
export function postAction(postAction: PostAction) {
    if (!docs.selected) return;
    const documentId = docs.selected.id;

    // mske sure an actions array and current action index exists for this document
    if (!actions[documentId]) actions[documentId] = [];
    if (currentActionIndex[documentId] === undefined) currentActionIndex[documentId] = -1;

    // remove any actions after the current action index
    actions[documentId] = actions[documentId].slice(0, currentActionIndex[documentId] + 1);

    // construct a full Action from the PostAction and the snapshot
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
        if (!snapshot) return;
        action = {
            type: 'transform',
            layerID: postAction.layerID,
            oldMatrix: snapshot.transform.matrix,
            newMatrix: postAction.newMatrix
        };
    } else if (postAction.type === 'content') {
        const snapshot = snapshots[postAction.layerID];
        if (!snapshot || snapshot.type !== 'canvas') return;
        action = {
            type: 'content',
            layerID: postAction.layerID,
            oldContent: snapshot.canvas.getContext('2d')!.getImageData(0, 0, snapshot.canvas.width, snapshot.canvas.height),
            newContent: postAction.newContent
        };
    } else if (postAction.type === 'update') {
        const snapshot = snapshots[postAction.layerID];
        if (!snapshot) return;

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
    } else {
        console.warn('Unknown postAction type:', postAction);
        return;
    }

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
}

/**
 * Deep copies a layer. For canvas layers, creates a new OffscreenCanvas and copies the contents.
 * Returns a shallow copy of any other layer properties.
 * @param layer 
 * @returns 
 */
export function deepCopyLayer(layer: Layer): Layer {
    const layerCopy: Layer = { ...layer};

    if (layerCopy.type === 'canvas' && layer.type === 'canvas') {
        // create a new OffscreenCanvas and copy the contents
        const canvasCopy = new OffscreenCanvas(layer.canvas.width, layer.canvas.height);
        const ctx = canvasCopy.getContext('2d');
        if (ctx) ctx.drawImage(layer.canvas, 0, 0);
        layerCopy.canvas = canvasCopy;
    }

    // copy the layer transform
    layerCopy.transform = { ...layer.transform };
    layerCopy.transform.matrix = layer.transform.matrix.translate(0, 0);

    return layerCopy;
}

/**
 * Updates internal state to reflect an undo action.
 * @param documentId 
 * @returns The action to be undone, or null if no action to undo.
 */
export function undoAction(documentId: DocumentID): Action | null {
    const a = actions[documentId];
    let index = currentActionIndex[documentId];

    if (a && index >= 0) {
        const action = a[index];
        currentActionIndex[documentId] = index - 1;
        updateSnapshot(action, 'undo');
        return action;
    }
    return null;
}

/**
 * Updates internal state to reflect a redo action.
 * @param documentId 
 * @returns The action to be redone, or null if no action to redo.
 */
export function redoAction(documentId: DocumentID): Action | null {
    const a = actions[documentId];
    let index = currentActionIndex[documentId];

    if (a && index < a.length - 1) {
        index = index + 1;
        const action = a[index];
        currentActionIndex[documentId] = index;
        updateSnapshot(action, 'redo');
        return action;
    }
    return null;
}

/**
 * Updates the snapshot for a layer based on the action type and whether it's an undo or redo.
 * @param action 
 * @param type 
 */
function updateSnapshot(action: Action, type: 'undo' | 'redo') {
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
    }
}