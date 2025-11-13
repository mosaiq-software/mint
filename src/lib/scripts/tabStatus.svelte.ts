import type { DocumentID } from './docs.svelte';

/** The index of the currently selected tab */
let tabIndex = $state(0);

/** Stores the status of each open tab/document */
const tabStatus: Record<DocumentID, {
    actionsSinceSave: number,
    tabIndex: number,
    canUndo: boolean,
    canRedo: boolean;
}> = $state({});

/** Initializes the tab status for a newly opened document/tab. */
export function initializeTab(id: DocumentID) {
    tabStatus[id] = {
        actionsSinceSave: 0,
        tabIndex: tabIndex++,
        canUndo: false,
        canRedo: false
    };
}

export default tabStatus;