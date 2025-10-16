import { undoAction, redoAction } from "./action";
import docs from "./docs.svelte";
import { deepCopyLayer } from "./action";

export function handleShortcuts(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 'z':
                event.preventDefault();
                handleUndo();
                break;
            case 'y':
                event.preventDefault();
                handleRedo();
                break;
        }
    }
}

function handleUndo() {
    if (!docs.selected) return;

    const action = undoAction(docs.selected.id);
    if (!action) return;

    if (action.type === 'create') {
        // layer was created, so remove it from document
        docs.selected.layers = docs.selected.layers.filter(l => l.id !== action.layer.id);
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
    }

    // force re-render
    docs.selected.layers = [...docs.selected.layers];
}

function handleRedo() {
    if (!docs.selected) return;

    const action = redoAction(docs.selected.id);
    if (!action) return;

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
    } else if (action.type === 'transform') {
        // layer was transformed, so apply newLayer state
        const layer = docs.selected.layers.find(l => l.id === action.layerID);
        if (layer) {
            layer.transform.matrix = action.newMatrix;
        }
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
    }

    // force re-render
    docs.selected.layers = [...docs.selected.layers];
}