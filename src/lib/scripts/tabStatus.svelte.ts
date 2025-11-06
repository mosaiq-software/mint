import type { DocumentID } from './docs.svelte';

let tabIndex = $state(0);

export function initializeTab(id: DocumentID) {
    tabStatus[id] = {
        actionsSinceSave: 0,
        tabIndex: tabIndex++,
        canUndo: false,
        canRedo: false
    };
}

const tabStatus: Record<DocumentID, {
    actionsSinceSave: number,
    tabIndex: number,
    canUndo: boolean,
    canRedo: boolean;
}> = $state({});
export default tabStatus;