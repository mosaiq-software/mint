import { getUndoAction, getRedoAction, updateSnapshot, applyUndoAction, applyRedoAction } from "./action";
import docs from "./docs.svelte";
import { saveDocumentToDB } from "./persistence.svelte";
import tabStatus from "./tabStatus.svelte.js";
import ui, { zoomAroundCenter, type Mode } from "./ui.svelte";
import { copyLayerToClipboard, pasteLayerFromClipboard } from "./copyPaste.svelte";
import type {TextLayer} from "./layer";

/**
 * Handles keyboard shortcuts for various application actions.
 * @param event The keyboard event to handle.
 */
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

/**
 * Toggles a boolean text property (like bold or italic) on the selected text layer.
 * @param property The text property to toggle.
 */
function toggleTextProperty<K extends keyof TextLayer>(property: K) {
    if (ui.selectedLayers.length !== 1) return;
    const layer = ui.selectedLayers[0];
    if (layer.type === 'text' && property in layer && typeof layer[property] === 'boolean') {
        layer[property] = !layer[property] as TextLayer[K];
    }
}

/** Handles copying the currently selected layer to the clipboard. */
function handleCopy() {
    if (ui.selectedLayers.length !== 1) return;
    copyLayerToClipboard(ui.selectedLayers[0]);
}

/** Handles pasting the layer from the clipboard into the current document. */
function handlePaste() {
    pasteLayerFromClipboard();
}

/** Handles saving the currently selected document to the database. */
export function handleSave() {
    if (!docs.selected) return;

    saveDocumentToDB(docs.selected).then(r => {
        tabStatus[r.id].actionsSinceSave = 0;
    });
}

/** Undoes the last action in the currently selected document. */
function handleUndo() {
    if (!docs.selected) return;

    const action = getUndoAction(docs.selected.id);
    if (!action) return;

    updateSnapshot(action, 'undo');
    applyUndoAction(action);
}

/** Redoes the last undone action in the currently selected document. */
function handleRedo() {
    if (!docs.selected) return;

    const action = getRedoAction(docs.selected.id);
    if (!action) return;

    updateSnapshot(action, 'redo');
    applyRedoAction(action);
}

/** Handles zooming in or out around the center of the viewport. */
function handleZoom(action: 'in' | 'out') {
    if (action === 'in') zoomAroundCenter(1.1);
    else zoomAroundCenter(1 / 1.1);
}