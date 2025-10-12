import ui from './ui.svelte';
import type { Layer } from './layer';
import type { Point } from './tools';

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

export function colorToHex6(color: Color): string {
    const r = color.r.toString(16).padStart(2, '0');
    const g = color.g.toString(16).padStart(2, '0');
    const b = color.b.toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

export function colorToHex8(color: Color): string {
    const r = color.r.toString(16).padStart(2, '0');
    const g = color.g.toString(16).padStart(2, '0');
    const b = color.b.toString(16).padStart(2, '0');
    const a = Math.round(color.a * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${a}`;
}

export function hexToColor(hex: string): Color | null {
    // Support #RRGGBBAA and #RRGGBB
    if (/^#([0-9a-fA-F]{8})$/.test(hex)) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const a = parseInt(hex.slice(7, 9), 16) / 255;
        return { r, g, b, a };
    }
    if (/^#([0-9a-fA-F]{6})$/.test(hex)) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b, a: 1 };
    }
    return null;
}

/* State */
const docs: Record<DocumentID, Document> = $state({});
export default docs;