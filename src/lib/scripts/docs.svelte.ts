import ui from './ui.svelte';
import type { Layer } from './layer';
import type { Point } from './tools';
import { populateSnapshots } from './action';

/* IDs */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type DocumentID = `document-${UUID}`;

/* Data Structures */
export type Transform = {
    // seems redundant, but allows for separated transforms
    matrix: DOMMatrix;
};

export type Color = {
    r: number; // 0-255
    g: number; // 0-255
    b: number; // 0-255
    a: number; // 0-1
}

export type TransformComponents = {
    translate: Point;
    rotate: number; // in degrees
    scale: Point;
}

/* Document */
export type Document = {
    id: DocumentID;
    name: string;
    width: number;
    height: number;
    layers: Layer[];
};

/* State */
const docs: Record<DocumentID, Document> & {selected: Document | null} = $state({
    selected: null
});

/* Functions */
export function matrixToTransformComponents(matrix: DOMMatrix): TransformComponents {
    const { a, b, c, d, e, f } = matrix;
    const scaleX = Math.sqrt(a * a + b * b);
    const scaleY = Math.sqrt(c * c + d * d);
    const rotate = Math.atan2(b, a) * (180 / Math.PI); // in degrees
    return {
        translate: { x: e, y: f },
        rotate,
        scale: { x: scaleX, y: scaleY }
    };
}

export function colorToCSS(color: Color): string {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

export function createDocument(name: string, width: number, height: number): DocumentID {
    const id: DocumentID = `document-${crypto.randomUUID()}`;
    docs[id] = {
        id, name, width, height, layers: []
    };

    ui[id] = {
        selectedLayers: [],
        foregroundColor: { r: 0, g: 0, b: 0, a: 1 },
        backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
        pan: { x: 0, y: 0 },
        zoom: 1
    }

    selectDocument(id);

    return id;
}

export function selectDocument(id: DocumentID) {
    console.log('selecting document', id);
    ui.selectedDocument = id;

    // populate selected UI and document for easy access
    ui.selected = ui[id];
    docs.selected = docs[id];

    populateSnapshots(docs[id].layers);
}

export default docs;