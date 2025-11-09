import type { DocumentID, Color } from "./docs.svelte";
import docs, { matrixToTransformComponents } from "./docs.svelte";
import type { Layer, LayerID } from "./layer";
import {RadioGroup} from "melt/builders";
import type { Point } from "./tools";

export const modes = ['select', 'draw', 'erase', 'text', 'rectangle', 'ellipse', 'fill'] as const;
export type Mode = typeof modes[number];

export type Bounds = {
    pos: Point,
    size: Point,
    rot: number
}

type UIAttributes = {
    selectedLayers: LayerID[];
    foregroundColor: Color;
    backgroundColor: Color;
    pan: { x: number; y: number };
    zoom: number;
    bounds: Bounds | null;
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
    selectedLayers: []
});

export function initializeUIForDocument(id: DocumentID) {
    ui[id] = {
        selectedLayers: [],
        foregroundColor: { r: 0, g: 0, b: 0, a: 1 },
        backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
        pan: { x: 0, y: 0 },
        zoom: 1,
        bounds: null
    }
}

export function updateSelectedLayers() {
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

let previousSelectedDocument: DocumentID | null = null;
let previousSelectedLayerIDs: LayerID[] = [];
let previousRotation = 0;
export function updateBoundingBox() {
    if (!ui.selected) return;

    // avoid resetting bounds on document change
    if (ui.selectedDocument !== previousSelectedDocument) {
        previousSelectedDocument = ui.selectedDocument;
        previousSelectedLayerIDs = ui.selected.selectedLayers;
        previousRotation = ui.selected.bounds?.rot ?? 0;
        return;
    }

    const currentSelectedLayerIDs = ui.selected?.selectedLayers ?? [];

    // detect selection change
    if (previousSelectedLayerIDs.length !== currentSelectedLayerIDs.length ||
        !previousSelectedLayerIDs.every((id, index) => id === currentSelectedLayerIDs[index])) {
        // determine if all selected layers have the same rotation
        const rotations = ui.selectedLayers.map(layer => {
            const m = matrixToTransformComponents(layer.transform.matrix);
            return m.rotate;
        });

        // if all rotations are the same (within a small tolerance), use that rotation
        const allSameRotation = rotations.every(rot => Math.abs(rot-rotations[0]) < 0.01);
        previousRotation = allSameRotation ? rotations[0] : 0;
    }
    previousSelectedLayerIDs = [...currentSelectedLayerIDs];

    // handle no selection
    if (ui.selectedLayers.length === 0) {
        previousRotation = 0;
        ui.selected.bounds = null;
        return;
    }

    // handle multi-layer selection: compute bounding box around all selected layers
    const allCorners = ui.selectedLayers.flatMap(layer => {
        const width = layer.type === 'canvas' ? layer.canvas.width : layer.width;
        const height = layer.type === 'canvas' ? layer.canvas.height : layer.height;
        
        return [
            new DOMPoint(0, 0),
            new DOMPoint(width, 0),
            new DOMPoint(width, height),
            new DOMPoint(0, height)
        ].map(corner => layer.transform.matrix.transformPoint(corner));
    });

    // rotate corners to align with previous bounding box rotation
    const inverseRotation = new DOMMatrix().rotate(-previousRotation);
    const rotatedCorners = allCorners.map(corner => corner.matrixTransform(inverseRotation));

    // calculate bounding box of selected layers
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const corner of rotatedCorners) {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
    }

    // transform top-left back to world space
    const topLeft = new DOMMatrix()
        .rotate(previousRotation)
        .transformPoint(new DOMPoint(minX, minY));

    ui.selected.bounds = {
        pos: { x: topLeft.x, y: topLeft.y },
        size: { x: maxX - minX, y: maxY - minY },
        rot: previousRotation
    };
}

export function setPreviousRotation(rot: number) {
    previousRotation = rot;
}

export const modesGroup = new RadioGroup({
    value: () => ui.mode,
    onValueChange: (val) => (ui.mode = val as Mode),
});

export default ui;