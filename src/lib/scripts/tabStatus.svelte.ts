import type { DocumentID } from './docs.svelte';

let tabIndex = $state(0);

export function initializeTab(id: DocumentID) {
    tabStatus[id] = {
        actionsSinceSave: 0,
        tabIndex: tabIndex++
    };
}

const tabStatus: Record<DocumentID, {
    actionsSinceSave: number,
    tabIndex: number
}> = $state({});
export default tabStatus;