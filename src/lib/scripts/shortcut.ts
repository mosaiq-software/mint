import { undoAction, redoAction } from "./action";
import { getSelectedDoc } from "./docs.svelte";

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
    const doc = getSelectedDoc();
    if (!doc) return;

    const action = undoAction(doc.id);
    if (!action) return;

    if (action.oldLayer === null) {
        // layer was deleted, so remove it from document
        doc.layers = doc.layers.filter(l => l.id !== action.layerID);
    } else {
        // layer was modified or added, so update it
        const layerIndex = doc.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            // update existing layer
            doc.layers[layerIndex] = action.oldLayer;
        } else {
            // add layer back to document
            doc.layers.push(action.oldLayer);
        }
    }
}

function handleRedo() {
    const doc = getSelectedDoc();
    if (!doc) return;

    const action = redoAction(doc.id);
    if (!action) return;

    if (action.newLayer === null) {
        // layer was deleted, so remove it from document
        doc.layers = doc.layers.filter(l => l.id !== action.layerID);
    } else {
        // layer was modified or added, so update it
        const layerIndex = doc.layers.findIndex(l => l.id === action.layerID);
        if (layerIndex !== -1) {
            // update existing layer
            doc.layers[layerIndex] = action.newLayer;
        } else {
            // add layer back to ducment
            doc.layers.push(action.newLayer);
        }
    }
}