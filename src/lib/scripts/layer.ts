import type { UUID, Transform, Color } from "./docs.svelte";
import { getSelectedDoc } from "./docs.svelte";

export type LayerID = `layer-${UUID}`;

/* Layers */
type BaseLayer = {
    id: LayerID;
    name: string;
    visible: boolean;
    opacity: number;
    transform: Transform;
}

export type CanvasLayer = BaseLayer & {
    type: 'canvas';
    canvas: OffscreenCanvas;
};

export type TextLayer = BaseLayer & {
    type: 'text';
    text: string;
    fontFamily: string;
    fontSize: number;
    color: Color;
};

export type Layer = CanvasLayer | TextLayer;

export function createLayer(type: 'canvas' | 'text', name: string): Layer {
    const doc = getSelectedDoc();
    if (!doc) throw new Error("No document selected");

    const id: LayerID = `layer-${crypto.randomUUID()}` as LayerID;
    const base: BaseLayer = {
        id,
        name,
        visible: true,
        opacity: 1,
        transform: {
            matrix: new DOMMatrix()
        }
    };

    if (type === 'canvas') {
        return {
            ...base,
            type: 'canvas',
            canvas: new OffscreenCanvas(doc.width, doc.height)
        };
    } else {
        return {
            ...base,
            type: 'text',
            text: 'New Text',
            fontFamily: 'Arial',
            fontSize: 24,
            color: { r: 0, g: 0, b: 0, a: 1 }
        };
    }
}