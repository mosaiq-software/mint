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

export function initializeUIForDocument(id: DocumentID) {
    ui[id] = {
        selectedLayers: [],
        foregroundColor: { r: 0, g: 0, b: 0, a: 1 },
        backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
        pan: { x: 0, y: 0 },
        zoom: 1
    }
}

export default ui;