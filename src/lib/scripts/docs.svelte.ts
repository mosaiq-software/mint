import ui from './ui.svelte';
import type { Layer } from './layer';

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
    translate: { x: number; y: number };
    rotate: number; // in degrees
    scale: { x: number; y: number };
}

/* Document */
export type Document = {
    id: DocumentID;
    name: string;
    width: number;
    height: number;
    layers: Layer[];
};

/* Functions */
export function getSelectedDoc(): Document | null {
    if (!ui.selectedDocument) return null;
    return docs[ui.selectedDocument] || null;
}

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

/* State */
const docs: Record<DocumentID, Document> = $state({});
export default docs;