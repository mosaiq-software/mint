import type { UUID, Transform, Color } from "./docs.svelte";
import { getSelectedDoc } from "./docs.svelte";
import ui from "./ui.svelte";
import text from "./tools/text.svelte";

export type LayerID = `layer-${UUID}`;

export type TextProperties = {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
}

/* Layers */
type BaseLayer = {
    id: LayerID;
    name: string;
    visible: boolean;
    opacity: number;
    transform: Transform;
    foregroundColor: Color;
    backgroundColor: Color;
}

export type CanvasLayer = BaseLayer & {
    type: 'canvas';
    canvas: OffscreenCanvas;
};

export type TextLayer = BaseLayer & TextProperties & {
    type: 'text';
    text: string;
    width: number;
    height: number;
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
        },
        foregroundColor: ui.foregroundColor,
        backgroundColor: ui.backgroundColor
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
            text: 'Text',
            width: text.properties.fontSize * 5,
            height: text.properties.fontSize * 1.2,
            ...text.properties
        };
    }
}