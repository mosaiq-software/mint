import type { DocumentID } from './docs.svelte';

const tabStatus: Record<DocumentID, {
    actionsSinceSave: number }
> = $state({});
export default tabStatus;