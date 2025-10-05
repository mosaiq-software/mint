import ui from './ui.svelte';

/* IDs */
export type UUID = `${string}-${string}-${string}-${string}-${string}`;
export type DocumentID = `document-${UUID}`;
export type LayerID = `layer-${UUID}`;

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

/* Layers */
type BaseLayer = {
    id: LayerID;
    name: string;
    visible: boolean;
    opacity: number;
    transform: Transform;
}

type ImageLayer = BaseLayer & {
    type: 'image';
    canvas: HTMLCanvasElement;
};

type TextLayer = BaseLayer & {
    type: 'text';
    text: string;
    fontFamily: string;
    fontSize: number;
    color: Color;
};

type PaintLayer = BaseLayer & {
    type: 'paint';
    canvas: HTMLCanvasElement;
    brushSize: number;
    brushColor: Color;
}

export type Layer = ImageLayer | TextLayer | PaintLayer;

/* Document */
export type Document = {
    id: DocumentID;
    name: string;
    width: number;
    height: number;
    layers: Layer[];
};

/* Functions */
export function getSelectedDoc(): Document {
    const selectedId = ui.selectedDocument;
    const doc = docs.find(d => d.id === selectedId);
    if (!doc) throw new Error('No document selected');
    return doc;
}

/* State */
const docs: Document[] = $state([]);

export default docs;