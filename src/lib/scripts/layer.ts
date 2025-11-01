import type { UUID, Transform, Color } from "./docs.svelte";
import docs from "./docs.svelte";
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
    if (!docs.selected || !ui.selected) throw new Error("No document selected");

    const id: LayerID = `layer-${crypto.randomUUID()}` as LayerID;
    const base: BaseLayer = {
        id,
        name,
        visible: true,
        opacity: 1,
        transform: {
            matrix: new DOMMatrix()
        },
        foregroundColor: ui.selected.foregroundColor,
        backgroundColor: ui.selected.backgroundColor
    };

    if (type === 'canvas') {
        return {
            ...base,
            type: 'canvas',
            canvas: new OffscreenCanvas(docs.selected.width, docs.selected.height)
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

export function translateLayerBy(layer: Layer, dx: number, dy: number) {
    const mat = layer.transform.matrix.translate(0, 0);
    mat.m41 = 0;
    mat.m42 = 0;

    // guard against non-invertible matrices
    let localDx = dx;
    let localDy = dy;
    try {
        const inv = mat.inverse();
        const localDelta = new DOMPoint(dx, dy).matrixTransform(inv);
        localDx = localDelta.x;
        localDy = localDelta.y;
    } catch (err) {
        // fallback: if inverse fails, use raw screen delta
    }

    layer.transform.matrix = layer.transform.matrix.translate(localDx, localDy);
}