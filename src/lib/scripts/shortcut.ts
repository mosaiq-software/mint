import { undoAction, redoAction } from "./action";
import docs from "./docs.svelte";

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

    if (action.oldLayer === null) {
        // layer was deleted, so remove it from document
        docs.selected.layers = docs.selected.layers.filter(l => l.id !== action.layerID);
    } else {
        // layer was modified or added, so update it
        const layerIndex = docs.selected.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            // update existing layer
            docs.selected.layers[layerIndex] = action.oldLayer;
        } else {
            // add layer back to document
            docs.selected.layers.push(action.oldLayer);
        }
    }
}

function handleRedo() {
    if (!docs.selected) return;

    const action = redoAction(docs.selected.id);
    if (!action) return;

    if (action.newLayer === null) {
        // layer was deleted, so remove it from document
        docs.selected.layers = docs.selected.layers.filter(l => l.id !== action.layerID);
    } else {
        // layer was modified or added, so update it
        const layerIndex = docs.selected.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            // update existing layer
            docs.selected.layers[layerIndex] = action.newLayer;
        } else {
            // add layer back to ducment
            docs.selected.layers.push(action.newLayer);
        }
    }
}