import type { DocumentID, Color } from "./docs.svelte";
import type { LayerID } from "./layer";

export const modes = ['select', 'draw', 'erase', 'text'] as const;
export type Mode = typeof modes[number];

type UIAttributes = {
    selectedLayers: LayerID[];
    foregroundColor: Color;
    backgroundColor: Color;
    pan: { x: number; y: number };
    zoom: number;
}

type UI  = Record<DocumentID, UIAttributes> & {
    mode: Mode;
    selected: UIAttributes | null;
    selectedDocument: DocumentID | null;
}

const ui: UI = $state({
    mode: 'select',
    selectedDocument: null,
    selected: null
});

export default ui;