import { getUndoAction, getRedoAction, updateSnapshot, applyUndoAction, applyRedoAction } from "./action";
import docs from "./docs.svelte";
import { deepCopyLayer } from "./action";
import {saveDocumentToDB} from "./persistence.svelte";
import tabStatus from "./tabStatus.svelte.js";
import ui, {type Mode, modesGroup} from "./ui.svelte";

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
        }
    } else {
        const newMode = {
            's': 'select',
            'd': 'draw',
            'e': 'erase',
            't': 'text',
            'f': 'fill'
        }[event.key];
        if (newMode) {
            modesGroup.value = newMode;
        }
    }
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