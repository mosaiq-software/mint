import type { DocumentID, Color } from "./docs.svelte";
import type { LayerID, Layer } from "./layer";

export const modes = ['select', 'draw', 'erase', 'text'] as const;
export type Mode = typeof modes[number];

interface Action {
    oldLayer: Layer | null;
    newLayer: Layer | null;
}

interface UI {
    mode: Mode;
    selectedDocument: DocumentID | null;
    selectedLayers: Record<DocumentID, LayerID[]>;
    actions: Record<DocumentID, Action[]>;
    foregroundColor: Color,
    backgroundColor: Color,
}

const ui: UI = $state({
    mode: modes[0],
    selectedDocument: null,
    selectedLayers: {},
    actions: {},
    foregroundColor: { r: 0, g: 0, b: 0, a: 1 },
    backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
});

export default ui;