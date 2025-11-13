import ui, { initializeUIForDocument } from './ui.svelte';
import type { Layer } from './layer';
import type { Point } from './tools';
import { populateSnapshots } from './action';
import tabStatus, {initializeTab} from "./tabStatus.svelte.js";

/* Types */

/** 
 * A unique identifier string used for documents and layers.
 * Matches the standard UUID format (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).
 */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type DocumentID = `document-${UUID}`;

/**
 * Stores transformation data for layers.
 * Includes translation, rotation, and scaling information.
 */
export type Transform = {
    matrix: DOMMatrix;
};

/**
 * Represents a color with red, green, blue, and alpha components.
 */
export type Color = {
    r: number; // 0-255
    g: number; // 0-255
    b: number; // 0-255
    a: number; // 0-1
}

/**
 * Breaks down transformation matrix into individual components.
 * Includes translation, rotation (in degrees), and scaling factors.
 */
export type TransformComponents = {
    translate: Point;
    rotate: number; // in degrees
    scale: Point;
}

/**
 * Represents a document with its properties and layers.
 * Includes unique ID, name, dimensions, and an array of layers.
 */
export type Document = {
    id: DocumentID;
    name: string;
    width: number;
    height: number;
    layers: Layer[];
};

/**
 * Stores all open documents in the application.
 * Aliases the currently selected document using the `selected` property.
 */
const docs: Record<DocumentID, Document> & {selected: Document | null} = $state({
    selected: null
});

/* Functions */

/**
 * Converts a layer's transformation matrix into individual transform components.
 * @param matrix A layer's transformation matrix.
 * @returns 
 */
export function matrixToTransformComponents(matrix: DOMMatrix): TransformComponents {
    const { a, b, c, d, e, f } = matrix;
    let scaleX = Math.hypot(a, b);
    let scaleY = Math.hypot(c, d);
    const determinant = a * d - b * c;
    if (determinant < 0) {
        scaleY = -scaleY;
    }
    const rotate = Math.atan2(b, a) * (180 / Math.PI); // in degrees
    return {
        translate: { x: e, y: f },
        rotate,
        scale: { x: scaleX, y: scaleY }
    };
}

/**
 * Converts a Color object to a CSS-compatible RGBA string.
 * @param color A color object.
 * @returns A CSS-compatible RGBA string.
 */
export function colorToCSS(color: Color): string {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}

/**
 * Creates a new document with the specified properties.
 * Initializes UI components and selects the new document.
 * @param name The name of the document.
 * @param width The width of the document.
 * @param height The height of the document.
 * @returns The unique identifier of the newly created document.
 */
export function createDocument(name: string, width: number, height: number): DocumentID {
    const id: DocumentID = `document-${crypto.randomUUID()}`;
    docs[id] = {
        id, name, width, height, layers: []
    };

    initializeUIForDocument(id);
    selectDocument(id);

    return id;
}

/**
 * Selects a document by its unique identifier.
 * Updates the global UI and document state to reflect the selected document.
 * @param id The unique identifier of the document to select, or null to deselect.
 */
export function selectDocument(id: DocumentID | null) {
    ui.selectedDocument = id;

    if (id === null) {
        ui.selected = null;
        docs.selected = null;
    } else {
        ui.selected = ui[id];
        docs.selected = docs[id];

        // populate snapshots for undo/redo functionality
        populateSnapshots(docs[id].layers);
        if (!(id in tabStatus)) {
            initializeTab(id);
        }
    }
}

export default docs;