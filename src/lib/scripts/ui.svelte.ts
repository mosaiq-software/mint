import type { DocumentID } from "./docs.svelte";

export const modes = ['select', 'draw', 'erase'] as const;
export type Mode = typeof modes[number];

interface UI {
    mode: Mode;
    selectedDocument: DocumentID | null;
}

const ui: UI = $state({
    mode: modes[0],
    selectedDocument: null,
});

export default ui;