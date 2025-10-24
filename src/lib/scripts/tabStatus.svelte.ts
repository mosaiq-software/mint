import type { DocumentID } from './docs.svelte';

let tabIndex = $state(0);

export function initializeTab(id: DocumentID) {
    tabStatus[id] = {
        actionsSinceSave: 0,
        tabIndex: tabIndex++,
        scrollX: 0,
        scrollY: 0
    };
}

const tabStatus: Record<DocumentID, {
    actionsSinceSave: number,
    tabIndex: number,
    scrollX: number,
    scrollY: number
}> = $state({});
export default tabStatus;