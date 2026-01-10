import type { UUID, Transform, Color } from "./docs.svelte";
import docs from "./docs.svelte";
import ui from "./ui.svelte";
import text from "./tools/text.svelte";
import { shape } from "./tools/utils/shape.svelte";

/** A unique layer identifier. */
export type LayerID = `layer-${UUID}`;

/** Text layer properties, including font and text styling. */
export type TextProperties = {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    bold: boolean;
    italic: boolean;
    underline: boolean;
};

/** Base properties shared by all layer types. */
type BaseLayer = {
    id: LayerID;
    name: string;
    visible: boolean;
    opacity: number;
    transform: Transform;
    foregroundColor: Color;
    backgroundColor: Color;
};

/** A layer storing pixel data. */
export type CanvasLayer = BaseLayer & {
    type: "canvas";
    canvas: OffscreenCanvas;
};

/** A layer storing text content and styling. */
export type TextLayer = BaseLayer &
    TextProperties & {
        type: "text";
        text: string;
        width: number;
        height: number;
    };

/** A layer representing a shape (rectangle or ellipse). */
export type ShapeLayer = BaseLayer & {
    width: number;
    height: number;
    strokeWidth: number;
    strokeAlign: "center" | "inside" | "outside";
};

/** A rectangle shape layer. */
export type RectangleLayer = ShapeLayer & {
    type: "rectangle";
    cornerRadius: number;
};

/** An ellipse shape layer. */
export type EllipseLayer = ShapeLayer & {
    type: "ellipse";
};

/** A layer in a document. */
export type Layer = CanvasLayer | TextLayer | RectangleLayer | EllipseLayer;

/**
 * Create an enumerated name from a name and an index.
 * @param name
 * @param index
 * @returns The enumerated name.
 */
function enumerateLayerName(name: string, index: number) {
    if (index === 1) return name;
    return `${name} ${index}`;
}

/**
 * Find the appropriately enumerated layer name for a new layer.
 * Returns the first unique value of "Layer", "Layer 2", etc.
 * @param name
 * @returns The appropriately enumerated name.
 */
export function getEnumeratedLayerName(name: string) {
    if (!docs.selected) return name;
    for (let i = 1; i <= docs.selected.layers.length; i++) {
        const enumeratedName = enumerateLayerName(name, i);
        if (!docs.selected.layers.some((l) => l.name === enumeratedName)) {
            return enumeratedName;
        }
    }
    return name;
}

/**
 * Creates a new layer of the specified type with default properties.
 * Here, the layer name is enumerated if duplicate. This is not the case on renames.
 * @param type The type of layer to create.
 * @param name The name of the new layer.
 * @param enumerateName Whether to enumerate the layer name.
 * @returns A new layer of the specified type with default properties.
 */
export function createLayer(
    type: "canvas" | "text" | "rectangle" | "ellipse",
    name: string,
    enumerateName: boolean = true,
): Layer {
    if (!docs.selected || !ui.selected) throw new Error("No document selected");

    const id: LayerID = `layer-${crypto.randomUUID()}` as LayerID;
    const base: BaseLayer = {
        id,
        name: enumerateName ? getEnumeratedLayerName(name) : name,
        visible: true,
        opacity: 1,
        transform: {
            matrix: new DOMMatrix(),
        },
        foregroundColor: ui.selected.foregroundColor,
        backgroundColor: ui.selected.backgroundColor,
    };

    if (type === "canvas") {
        return {
            ...base,
            type: "canvas",
            canvas: new OffscreenCanvas(
                docs.selected.width,
                docs.selected.height,
            ),
        };
    } else if (type === "text") {
        return {
            ...base,
            type: "text",
            text: "Text",
            width: text.properties.fontSize * 5,
            height: text.properties.fontSize * 1.2,
            ...text.properties,
        };
    } else if (type === "rectangle") {
        return {
            ...base,
            type: "rectangle",
            width: 0,
            height: 0,
            strokeWidth: shape.strokeWidth,
            strokeAlign: shape.strokeAlign,
            cornerRadius: shape.cornerRadius,
        };
    } else if (type === "ellipse") {
        return {
            ...base,
            type: "ellipse",
            width: 0,
            height: 0,
            strokeWidth: shape.strokeWidth,
            strokeAlign: shape.strokeAlign,
        };
    } else {
        throw new Error(`Unknown layer type: ${type}`);
    }
}

/**
 * Translates a layer by the specified delta x and delta y values in canvas space.
 * @param layer The layer to translate.
 * @param dx The delta x to translate by.
 * @param dy The delta y to translate by.
 */
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
