import { getUndoAction, getRedoAction, updateSnapshot, applyUndoAction, applyRedoAction } from "./action";
import docs from "./docs.svelte";
import { saveDocumentToDB } from "./persistence.svelte";
import tabStatus from "./tabStatus.svelte.js";
import ui, { zoomAroundCenter, type Mode } from "./ui.svelte";
import { clipboard, pasteLayerFromClipboard } from "./copypaste.svelte";
import type {TextLayer} from "./layer";

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
            case 'b':
                event.preventDefault();
                event.stopPropagation();
                toggleTextProperty('bold');
                break;
            case 'i':
                event.preventDefault();
                event.stopPropagation();
                toggleTextProperty('italic');
                break;
            case 'c':
                event.preventDefault();
                handleCopy();
                break;
            case 'v':
                event.preventDefault();
                handlePaste();
                break;
            case '=':
                event.preventDefault();
                handleZoom('in');
                break;
            case '-':
                event.preventDefault();
                handleZoom('out');
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

function toggleTextProperty<K extends keyof TextLayer>(property: K) {
    if (!docs.selected) return;
    const selectedLayerID = ui.selected?.selectedLayers[0];
    if (!selectedLayerID) return;
    const layer = docs.selected.layers.find(l => l.id === selectedLayerID);
    if (layer && layer.type === 'text' && property in layer && typeof layer[property] === 'boolean') {
        layer[property] = !layer[property] as TextLayer[K];
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

function handleZoom(action: 'in' | 'out') {
    if (action === 'in') zoomAroundCenter(1.1);
    else zoomAroundCenter(1 / 1.1);
}