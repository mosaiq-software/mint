import { getUndoAction, getRedoAction, updateSnapshot, applyUndoAction, applyRedoAction } from "./action";
import docs from "./docs.svelte";
import { saveDocumentToDB } from "./persistence.svelte";
import tabStatus from "./tabStatus.svelte.js";
import ui, { type Mode } from "./ui.svelte";
import { clipboard, pasteLayerFromClipboard } from "./copypaste.svelte";

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
            case 's':
                event.preventDefault();
                handleSave();
                break;
            case 'c':
                event.preventDefault();
                handleCopy();
                break;
            case 'v':
                event.preventDefault();
                handlePaste();
                break;
        }
    } else {
        const newMode = {
            's': 'select',
            'd': 'draw',
            'e': 'erase',
            't': 'text',
            'f': 'fill',
            'r': 'rectangle',
            'c': 'ellipse',
        }[event.key];
        if (newMode) ui.mode = newMode as Mode;
    }
}

function handleCopy() {
    if (!docs.selected) return;
    const selectedLayerID = ui.selected?.selectedLayers[0];
    if (selectedLayerID) {
        const selectedLayer = docs.selected.layers.find(l => l.id === selectedLayerID);
        if (selectedLayer) {
            clipboard.layer = selectedLayer;
        }
    }
}

function handlePaste() {
    pasteLayerFromClipboard();
}

export function handleSave() {
    if (!docs.selected) return;

    saveDocumentToDB(docs.selected).then(r => {
        tabStatus[r.id].actionsSinceSave = 0;
    });
}

function handleUndo() {
    if (!docs.selected) return;

    const action = getUndoAction(docs.selected.id);
    if (!action) return;

    updateSnapshot(action, 'undo');
    applyUndoAction(action);
}

function handleRedo() {
    if (!docs.selected) return;

    const action = getRedoAction(docs.selected.id);
    if (!action) return;

    updateSnapshot(action, 'redo');
    applyRedoAction(action);
}