import type { Tool, Point } from ".";
import docs, {
    matrixToTransformComponents,
    type Document,
} from "../docs.svelte";
import ui, { type Bounds } from "../ui.svelte";
import { translateLayerBy, type CanvasLayer, type Layer } from "../layer";
import { postAction, type PostAction } from "../action";
import { findLayerAtPoint, updateSelectionForClick } from "./utils/select";

const scaleHandleHitboxSize = 5;
const minSize = 1;

/** The scale directions represented by each scale handle */
export type ScaleDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** The current crop tool action */
export type CropAction =
    | {
          type: "idle";
      }
    | {
          type: "move";
      }
    | {
          type: "scale";
          direction: ScaleDirection;
      };

class CropState {
    action: CropAction = $state({ type: "idle" });
    dragging: boolean = $state(false);
    target: "none" | "document" | CanvasLayer = $derived.by(findCropTarget);
    bounds: Bounds | null = $derived.by(initializeBounds);
}
const crop = new CropState();

function findCropTarget() {
    if (ui.mode !== "crop") return "none";

    const selectedCanvasLayers = getSelectedCanvasLayers();
    if (selectedCanvasLayers.length > 0) {
        return selectedCanvasLayers[0];
    }

    if (docs.selected) {
        return "document";
    }

    return "none";
}

function getSelectedCanvasLayers(): CanvasLayer[] {
    if (!docs.selected) return [];
    return (
        ui.selected?.selectedLayers
            .map((id) => docs.selected?.layers.find((l) => l.id === id))
            .filter(
                (layer): layer is CanvasLayer =>
                    layer !== undefined && layer.type === "canvas",
            ) ?? []
    );
}

function initializeBounds() {
    if (crop.target === "none") return null;

    if (crop.target === "document") {
        if (!docs.selected) return null;
        return getDocumentBounds(docs.selected);
    }

    return getLayerBounds(crop.target);
}

function getDocumentBounds(doc: Document): Bounds | null {
    return {
        pos: { x: 0, y: 0 },
        size: { x: doc.width, y: doc.height },
        rot: 0,
    };
}

const initial = {
    bounds: null as Bounds | null,
    c: { x: 0, y: 0 } as Point,
};

/** The crop tool implementation. */
export const cropTool: Tool = {
    name: "crop",
    onPointerDown: (data) => {
        crop.dragging = true;
        if (!docs.selected) return;
        setAction(data.v, data.c, data.e);

        if (crop.action.type === "idle") {
            const found =
                findLayerAtPoint(docs.selected.layers, data.c)?.id ?? null;

            if (ui.selected) {
                ui.selected.selectedLayers = updateSelectionForClick(
                    found,
                    ui.selected.selectedLayers,
                    data.e.shiftKey,
                );
            }
        } else if (crop.bounds) {
            // store initial bounds and pointer position
            initial.bounds = {
                pos: { x: crop.bounds.pos.x, y: crop.bounds.pos.y },
                size: { x: crop.bounds.size.x, y: crop.bounds.size.y },
                rot: crop.bounds.rot,
            };
            initial.c = { x: data.c.x, y: data.c.y };
        }
    },
    onPointerMove: (data) => {
        if (crop.dragging) {
            if (crop.action.type === "move") {
                moveBounds(data.c);
            } else if (crop.action.type === "scale") {
                scaleBounds(crop.action.direction, data.c);
            }
        } else {
            setAction(data.v, data.c, data.e);
        }
    },
    onPointerUp: (data) => {
        crop.dragging = false;

        // after mouse up, determine action based on mouse position
        setAction(data.v, data.c, data.e);
    },
    onKeyDown: (e) => {
        if (e.key === "Enter") {
            applyCrop();
            ui.mode = "select";
        }
    },
};

/**
 * Moves the crop bounds based on the mouse position
 */
function moveBounds(mousePos: Point) {
    if (!initial.bounds) return;

    const dx = mousePos.x - initial.c.x;
    const dy = mousePos.y - initial.c.y;

    crop.bounds = {
        pos: {
            x: initial.bounds.pos.x + dx,
            y: initial.bounds.pos.y + dy,
        },
        size: { ...initial.bounds.size },
        rot: initial.bounds.rot,
    };
}

/**
 * Scales the crop bounds based on the mouse position and the active scale handle
 */
function scaleBounds(dir: ScaleDirection, mousePos: Point) {
    if (!initial.bounds) return;

    const pivotWorld = getWorldSpacePivot(dir, initial.bounds);

    // translate initial and current pointer positions to local (bounds) space
    const rotMatrix = new DOMMatrix().rotate(-initial.bounds.rot);
    const initialLocal = new DOMPoint(initial.c.x, initial.c.y).matrixTransform(
        rotMatrix,
    );
    const currentLocal = new DOMPoint(mousePos.x, mousePos.y).matrixTransform(
        rotMatrix,
    );

    // calculate scale factors, clamped so the box can't invert
    const { scaleX, scaleY } = calculateClampedScaleFactors(
        initialLocal,
        currentLocal,
        dir,
        initial.bounds,
    );

    crop.bounds = resizeBounds(initial.bounds, scaleX, scaleY, pivotWorld);
}

/**
 * Calculates the world space position of the bounds' pivot point
 */
function getWorldSpacePivot(
    dir: ScaleDirection,
    initialBounds: Bounds,
): DOMPoint {
    const matrix = new DOMMatrix()
        .translate(initialBounds.pos.x, initialBounds.pos.y)
        .rotate(initialBounds.rot);
    const pivot = getScalePivotPoint(
        dir,
        initialBounds.size.x,
        initialBounds.size.y,
    );
    const pivotWorld = new DOMPoint(pivot.x, pivot.y).matrixTransform(matrix);

    return pivotWorld;
}

function calculateClampedScaleFactors(
    initialVector: DOMPoint,
    currentVector: DOMPoint,
    dir: ScaleDirection,
    initialBounds: Bounds,
): { scaleX: number; scaleY: number } {
    const dx = currentVector.x - initialVector.x;
    const dy = currentVector.y - initialVector.y;

    let scaleX =
        (initialBounds.size.x +
            (dir.includes("e") ? dx : dir.includes("w") ? -dx : 0)) /
        initialBounds.size.x;
    let scaleY =
        (initialBounds.size.y +
            (dir.includes("s") ? dy : dir.includes("n") ? -dy : 0)) /
        initialBounds.size.y;

    scaleX = Math.max(scaleX, minSize / initialBounds.size.x);
    scaleY = Math.max(scaleY, minSize / initialBounds.size.y);

    return { scaleX, scaleY };
}

/**
 * Applies the crop operation to the current target (document or layer)
 */
function applyCrop() {
    if (crop.target === "none") return;
    if (crop.target === "document") {
        if (docs.selected) applyDocumentCrop(docs.selected);
        else return;
    } else applyLayerCrop(crop.target);
}

/**
 * Crops/expands the document to the crop bounds, translating
 * all layers accordingly
 * @param doc The document to crop.
 */
function applyDocumentCrop(doc: Document) {
    if (!crop.bounds) return;
    const bounds = crop.bounds;

    const newWidth = Math.round(bounds.size.x);
    const newHeight = Math.round(bounds.size.y);
    if (newWidth <= 0 || newHeight <= 0) return;

    // set up the document action for undo/redo
    const actions: PostAction[] = [
        {
            type: "document",
            oldDocument: { id: doc.id, width: doc.width, height: doc.height },
            newDocument: { id: doc.id, width: newWidth, height: newHeight },
        },
    ];

    // translate all layers so that the crop bounds' position is at the origin
    for (const layer of doc.layers) {
        translateLayerBy(layer, -bounds.pos.x, -bounds.pos.y);
        actions.push({
            type: "transform",
            layerID: layer.id,
            newMatrix: layer.transform.matrix,
            newBounds: null,
        });
    }

    postAction({ type: "compound", actions });

    doc.width = newWidth;
    doc.height = newHeight;
}

/**
 * Crops/expands the current layer to the crop bounds
 * @param layer The canvas layer to crop.
 */
function applyLayerCrop(layer: CanvasLayer) {
    if (!docs.selected || !crop.bounds) return;

    // use the crop bounds to create the bounds for a new layer
    const localCorners = boundsToLayerSpaceCorners(crop.bounds, layer);
    const newBounds = cornersToRoundedLayerBounds(localCorners);
    if (newBounds.size.x <= 0 || newBounds.size.y <= 0) return;

    // create a new canvas with the cropped content and update the layer
    const newCanvas = createCroppedCanvas(layer, newBounds);
    layer.canvas = newCanvas;
    layer.transform.matrix = layer.transform.matrix.translate(
        newBounds.pos.x,
        newBounds.pos.y,
    );

    // create actions for undo/redo
    const actions = assembleLayerCropActions(layer);
    postAction({
        type: "compound",
        actions,
    });

    // trigger re-render
    docs.selected.layers = [...docs.selected.layers];
}

/**
 * Converts the crop bounds from world space to the layer's local space,
 * returning the four corners of the bounds in local coordinates.
 */
function boundsToLayerSpaceCorners(bounds: Bounds, layer: Layer): DOMPoint[] {
    const boxMatrix = new DOMMatrix()
        .translate(bounds.pos.x, bounds.pos.y)
        .rotate(bounds.rot);

    const worldCorners = [
        new DOMPoint(0, 0),
        new DOMPoint(bounds.size.x, 0),
        new DOMPoint(bounds.size.x, bounds.size.y),
        new DOMPoint(0, bounds.size.y),
    ].map((p) => p.matrixTransform(boxMatrix));

    const invMatrix = layer.transform.matrix.inverse();
    const localCorners = worldCorners.map((p) => p.matrixTransform(invMatrix));

    return localCorners;
}

/**
 * Converts an array of corners in local space to the rounded size
 * and position of the new layer in layer space
 */
function cornersToRoundedLayerBounds(corners: DOMPoint[]): Bounds {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const corner of corners) {
        minX = Math.min(minX, corner.x);
        minY = Math.min(minY, corner.y);
        maxX = Math.max(maxX, corner.x);
        maxY = Math.max(maxY, corner.y);
    }

    const newMinX = Math.round(minX);
    const newMinY = Math.round(minY);
    const newWidth = Math.round(maxX) - newMinX;
    const newHeight = Math.round(maxY) - newMinY;

    return {
        pos: { x: newMinX, y: newMinY },
        size: { x: newWidth, y: newHeight },
        rot: 0,
    };
}

/**
 * Creates a new OffscreenCanvas containing the cropped content of the layer
 * based on the given bounds
 */
function createCroppedCanvas(
    layer: CanvasLayer,
    bounds: Bounds,
): OffscreenCanvas {
    const { size, pos } = bounds;
    const newCanvas = new OffscreenCanvas(size.x, size.y);
    const ctx = newCanvas.getContext("2d");
    if (!ctx) return newCanvas;

    ctx.drawImage(
        layer.canvas,
        pos.x,
        pos.y,
        size.x,
        size.y,
        0,
        0,
        size.x,
        size.y,
    );

    return newCanvas;
}

/**
 * Assembles the actions needed to undo/redo a layer crop operation
 */
function assembleLayerCropActions(layer: CanvasLayer): PostAction[] {
    const actions: PostAction[] = [];

    actions.push({
        type: "transform",
        layerID: layer.id,
        newMatrix: layer.transform.matrix,
        newBounds: null,
    });

    const ctx = layer.canvas.getContext("2d");
    const newContent = ctx
        ? ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
        : new ImageData(layer.canvas.width, layer.canvas.height);
    actions.push({
        type: "content",
        layerID: layer.id,
        newContent,
    });

    return actions;
}

/**
 * Modifies the crop tool action based on mouse position
 */
function setAction(viewportPos: Point, canvasPos: Point, event: MouseEvent) {
    const v = viewportPos;
    const c = canvasPos;
    const e = event;

    if (!docs.selected || !crop.bounds) {
        crop.action = { type: "idle" };
        return;
    }

    const bounds = crop.bounds;
    const matrix = new DOMMatrix()
        .translate(bounds.pos.x, bounds.pos.y)
        .rotate(bounds.rot);

    const handlePositions = getScaleHandlePositions(
        matrix,
        bounds.size.x,
        bounds.size.y,
    );

    // check if mouse is over any scale handle
    let overScaleHandle: ScaleDirection | null = null;
    for (const dir in handlePositions) {
        const pos = handlePositions[dir as ScaleDirection];
        const zoom = ui.selected?.zoom ?? 1;
        const vPos = new DOMPoint(pos.x * zoom, pos.y * zoom);
        const dist = Math.hypot(v.x - vPos.x, v.y - vPos.y);
        if (dist < scaleHandleHitboxSize) {
            overScaleHandle = dir as ScaleDirection;
            break;
        }
    }

    if (overScaleHandle) {
        crop.action = { type: "scale", direction: overScaleHandle };
        return;
    }

    // if shift is held, use idle (so clicking still toggles selection instead of moving)
    if (e.shiftKey) {
        crop.action = { type: "idle" };
        return;
    }

    // check if mouse is within bounds
    const invMatrix = matrix.inverse();
    const c_rot = new DOMPoint(c.x, c.y).matrixTransform(invMatrix);

    if (
        c_rot.x >= 0 &&
        c_rot.x <= bounds.size.x &&
        c_rot.y >= 0 &&
        c_rot.y <= bounds.size.y
    ) {
        crop.action = { type: "move" };
        return;
    }

    crop.action = { type: "idle" };
}

/**
 * Derives a layer's un-scaled, oriented bounding box in world space
 * (origin, size, and rotation), since the layer's own transform may
 * include scale that the crop box does not track.
 * @param layer The layer to derive bounds for.
 * @returns The layer's bounding box in world space.
 */
function getLayerBounds(layer: Layer): Bounds {
    const width = layer.type === "canvas" ? layer.canvas.width : layer.width;
    const height = layer.type === "canvas" ? layer.canvas.height : layer.height;
    const rot = matrixToTransformComponents(layer.transform.matrix).rotate;

    // get the corners of the layer after transformation
    const corners = [
        new DOMPoint(0, 0),
        new DOMPoint(width, 0),
        new DOMPoint(width, height),
        new DOMPoint(0, height),
    ].map((corner) => layer.transform.matrix.transformPoint(corner));

    // rotate corners to align with the layer's own rotation
    const inverseRotation = new DOMMatrix().rotate(-rot);
    const rotatedCorners = corners.map((corner) =>
        corner.matrixTransform(inverseRotation),
    );

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
        .rotate(rot)
        .transformPoint(new DOMPoint(minX, minY));

    return {
        pos: { x: topLeft.x, y: topLeft.y },
        size: { x: maxX - minX, y: maxY - minY },
        rot,
    };
}

/**
 * Resizes a bounding box by the given scale factors around a pivot point in
 * world space, keeping its rotation fixed
 */
function resizeBounds(
    bounds: Bounds,
    scaleX: number,
    scaleY: number,
    pivot: Point,
): Bounds {
    const matrix = new DOMMatrix()
        .translate(bounds.pos.x, bounds.pos.y)
        .rotate(bounds.rot);

    const newMatrix = new DOMMatrix()
        .translate(pivot.x, pivot.y)
        .rotate(bounds.rot)
        .scale(scaleX, scaleY)
        .rotate(-bounds.rot)
        .translate(-pivot.x, -pivot.y)
        .multiply(matrix);

    const m = matrixToTransformComponents(newMatrix);

    return {
        pos: { x: m.translate.x, y: m.translate.y },
        size: {
            x: Math.max(minSize, bounds.size.x * Math.abs(m.scale.x)),
            y: Math.max(minSize, bounds.size.y * Math.abs(m.scale.y)),
        },
        rot: bounds.rot,
    };
}

/**
 * Calculates the world positions of the scale handles given a transform matrix and size
 */
function getScaleHandlePositions(
    transform: DOMMatrix,
    width: number,
    height: number,
): Record<ScaleDirection, Point> {
    // get the corners of the bounding box after transformation
    const corners = [
        new DOMPoint(0, 0).matrixTransform(transform), // top-left
        new DOMPoint(width, 0).matrixTransform(transform), // top-right
        new DOMPoint(width, height).matrixTransform(transform), // bottom-right
        new DOMPoint(0, height).matrixTransform(transform), // bottom-left
    ];

    // calculate handle positions
    return {
        nw: { x: corners[0].x, y: corners[0].y },
        ne: { x: corners[1].x, y: corners[1].y },
        se: { x: corners[2].x, y: corners[2].y },
        sw: { x: corners[3].x, y: corners[3].y },
        n: {
            x: (corners[0].x + corners[1].x) / 2,
            y: (corners[0].y + corners[1].y) / 2,
        },
        e: {
            x: (corners[1].x + corners[2].x) / 2,
            y: (corners[1].y + corners[2].y) / 2,
        },
        s: {
            x: (corners[2].x + corners[3].x) / 2,
            y: (corners[2].y + corners[3].y) / 2,
        },
        w: {
            x: (corners[3].x + corners[0].x) / 2,
            y: (corners[3].y + corners[0].y) / 2,
        },
    };
}

/**
 * Returns the pivot point (in local space) for scaling, based on the direction.
 * @param direction The scale direction
 * @param width The bounding box width
 * @param height The bounding box height
 * @returns The pivot point in local space
 */
function getScalePivotPoint(
    direction: ScaleDirection,
    width: number,
    height: number,
): Point {
    switch (direction) {
        case "n":
            return { x: width / 2, y: height };
        case "s":
            return { x: width / 2, y: 0 };
        case "e":
            return { x: 0, y: height / 2 };
        case "w":
            return { x: width, y: height / 2 };
        case "ne":
            return { x: 0, y: height };
        case "nw":
            return { x: width, y: height };
        case "se":
            return { x: 0, y: 0 };
        case "sw":
            return { x: width, y: 0 };
    }
}

export default crop;
