import type { DocumentID, Color } from "./docs.svelte";
import docs from "./docs.svelte";
import type { Layer, LayerID } from "./layer";
import {RadioGroup} from "melt/builders";

export const modes = ['select', 'draw', 'erase', 'text', 'rectangle', 'ellipse', 'fill'] as const;
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
    selectedLayers: Layer[];
}

const ui: UI = $state({
    mode: 'select',
    selectedDocument: null,
    selected: null,
    selectedLayers: [],
});

export function initializeUIForDocument(id: DocumentID) {
    ui[id] = {
        selectedLayers: [],
        foregroundColor: { r: 0, g: 0, b: 0, a: 1 },
        backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
        pan: { x: 0, y: 0 },
        zoom: 1,
    }
}

export function updateSelectedLayers() {
    console.log("Updating selected layers");
    if (!docs.selected) {
        ui.selectedLayers = [];
        return;
    }

    const selectedLayerIDs = ui.selected?.selectedLayers ?? [];
    const selectedLayers: Layer[] = [];
    for (const layerId of selectedLayerIDs) {
        const layer = docs.selected.layers.find(l => l.id === layerId);
        if (layer) selectedLayers.push(layer);
    }
    ui.selectedLayers = selectedLayers;
}

export const modesGroup = new RadioGroup({
    value: () => ui.mode,
    onValueChange: (val) => (ui.mode = val as Mode),
});

export default ui;