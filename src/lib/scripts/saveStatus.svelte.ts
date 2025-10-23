import type { DocumentID } from './docs.svelte';

const saveStatus: Record<DocumentID, number> = $state({});
export default saveStatus;