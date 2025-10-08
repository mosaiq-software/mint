import type { Tool } from ".";
import { getSelectedDoc } from "../docs.svelte";
import type { Point } from ".";
import ui from "../ui.svelte";
import type { Layer } from "../layer";

export type ScaleDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export type SelectAction = {
    type: 'select'
} | {
    type: 'move',
} | {
    type: 'scale',
    direction: ScaleDirection,
} | {
    type: 'rotate',
}

export const selectState = $state({
    action: { type: 'select' } as SelectAction,
    dragging: false,
    previous: {
        c: { x: 0, y: 0 } as Point
    },
    initial: {
        l: { x: 0, y: 0 } as Point,
        matrix: new DOMMatrix(),
        pivot: { x: 0, y: 0} as Point
    }
});

const scaleHandleHitboxSize = 3;
const rotateHandleHitboxSize = 3;
const rotateHandleOffset = 25; // distance above the bounding box

const select: Tool = {
    name: 'select',
    onPointerDown: (data) => {
        selectState.dragging = true;

        const doc = getSelectedDoc();
        if (!doc) return;

        const selectedLayers = ui.selectedLayers[doc.id];
        const firstSelectedLayer = selectedLayers.length > 0 ?
            doc.layers.find(l => l.id === selectedLayers[0]) : null;

        if (selectState.action.type === 'select') {
            // traverse layers from top to bottom to find the first shape under the cursor
            let found = false;
            for (let i = doc.layers.length - 1; i >= 0; i--) {
                const layer = doc.layers[i];
                if (layer.type === 'canvas' && layer.visible) {
                    // sample canvas pixel at data.c, transformed to layer space
                    const ctx = layer.canvas.getContext('2d');
                    if (!ctx) continue;

                    const invMatrix = layer.transform.matrix.inverse();
                    const point = new DOMPoint(data.c.x, data.c.y).matrixTransform(invMatrix);
                    const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;

                    // if pixel is not transparent, select this layer
                    if (pixel[3] > 0) {
                        ui.selectedLayers[doc.id] = [layer.id];
                        found = true;
                        selectState.action = { type: 'move' };
                        break;
                    }
                }
            }

            // if no layer found, clear selection and prepare to move layer
            if (!found) ui.selectedLayers[doc.id] = [];
        } else if (selectState.action.type === 'scale') {
            if (firstSelectedLayer) {
                selectState.initial.pivot = getScalePivotPoint(selectState.action.direction, firstSelectedLayer);
            }
        }

        if (firstSelectedLayer) {
            selectState.initial.matrix = firstSelectedLayer.transform.matrix.translate(0, 0);
        }

        selectState.previous.c = data.c;
        if (data.l) selectState.initial.l = data.l;
    },
    onPointerMove: (data) => {
        if (selectState.dragging) {
            // todo: handle dragging based on selectState.action

            const doc = getSelectedDoc();
            if (!doc) return;

            if (selectState.action.type === 'move') {
                const selectedLayers = ui.selectedLayers[doc.id];
                if (selectedLayers.length === 0) return;

                // move all selected layers by the delta
                let deltaX = data.c.x - selectState.previous.c.x;
                let deltaY = data.c.y - selectState.previous.c.y;

                for (const layerId of selectedLayers) {
                    const layer = doc.layers.find(l => l.id === layerId);
                    if (layer) {
                        // map screen delta into the layer's local (non-translated) space
                        // so translation is not affected by the layer's scale/rotation.
                        const mat = layer.transform.matrix.translate(0, 0);

                        // zero out translation so we invert only the linear part (scale+rotate)
                        mat.m41 = 0;
                        mat.m42 = 0;

                        // guard against non-invertible matrices
                        let localDx = deltaX;
                        let localDy = deltaY;
                        try {
                            const inv = mat.inverse();
                            const localDelta = new DOMPoint(deltaX, deltaY).matrixTransform(inv);
                            localDx = localDelta.x;
                            localDy = localDelta.y;
                        } catch (err) {
                            // fallback: if inverse fails, use raw screen delta
                        }

                        layer.transform.matrix = layer.transform.matrix.translate(localDx, localDy);
                    }
                }
            } else if (selectState.action.type === 'scale') {
                const dir = selectState.action.direction;

                // find the selected layer
                const selectedLayers = ui.selectedLayers[doc.id];
                if (selectedLayers.length !== 1) return;
                const layer = doc.layers.find(l => l.id === selectedLayers[0]);
                if (!layer) return;
                if (!data.l) return;

                // calculate current point in initial layer space
                const currentPoint = new DOMPoint(data.c.x, data.c.y)
                    .matrixTransform(selectState.initial.matrix.inverse());
                if (isNaN(currentPoint.x) || isNaN(currentPoint.y)) return;

                // calculate scale factor based on mouse movement and scale direction
                const deltaX = currentPoint.x - selectState.initial.l.x;
                const deltaY = currentPoint.y - selectState.initial.l.y;
                const layerWidth = (layer.type === 'canvas' ? layer.canvas.width : layer.width);
                const layerHeight = (layer.type === 'canvas' ? layer.canvas.height : layer.height);

                let scaleX;
                if (dir.includes('e')) scaleX = (layerWidth + deltaX) / layerWidth;
                else if (dir.includes('w')) scaleX = (layerWidth - deltaX) / layerWidth;
                else scaleX = 1;

                let scaleY;
                if (dir.includes('s')) scaleY = (layerHeight + deltaY) / layerHeight;
                else if (dir.includes('n')) scaleY = (layerHeight - deltaY) / layerHeight;
                else scaleY = 1;

                // apply scaling around the pivot in layer space
                const { x: px, y: py } = selectState.initial.pivot;
                layer.transform.matrix = selectState.initial.matrix
                    .translate(px, py)
                    .scale(scaleX, scaleY)
                    .translate(-px, -py);
            } else if (selectState.action.type === 'rotate') {
                // find the selected layer
                const selectedLayers = ui.selectedLayers[doc.id];
                if (selectedLayers.length !== 1) return;
                const layer = doc.layers.find(l => l.id === selectedLayers[0]);
                if (!layer) return;
                if (!data.l) return;

                const layerWidth = (layer.type === 'canvas' ? layer.canvas.width : layer.width);
                const layerHeight = (layer.type === 'canvas' ? layer.canvas.height : layer.height);

                // compute the center in local and world space
                const localCenter = new DOMPoint(layerWidth / 2, layerHeight / 2);
                const worldCenter = localCenter.matrixTransform(selectState.initial.matrix);

                // calculate angle delta based on mouse movement
                const currentPoint = new DOMPoint(data.c.x, data.c.y);
                const delta = {
                    x: currentPoint.x - worldCenter.x,
                    y: currentPoint.y - worldCenter.y
                }
                const currentAngle = Math.atan2(delta.y, delta.x) + Math.PI / 2;

                // decompose scale from the initial matrix
                const m = selectState.initial.matrix;
                const scaleX = Math.hypot(m.a, m.b);
                const scaleY = Math.hypot(m.c, m.d);

                // compose the new matrix:
                // translate to world center, rotate, scale, translate back
                const newMatrix = new DOMMatrix()
                    .translate(worldCenter.x, worldCenter.y)
                    .rotate((currentAngle * 180) / Math.PI)
                    .scale(scaleX, scaleY)
                    .translate(-localCenter.x, -localCenter.y);

                layer.transform.matrix = newMatrix;
            }
        } else {
            // determine action based on mouse position
            setAction(data.c, data.l);
        }

        selectState.previous.c = data.c;
    },
    onPointerUp: (data) => {
        selectState.dragging = false;

        // after mouse up, determine action based on mouse position
        setAction(data.c, data.l);
    }   
}

function setAction(c: Point, l: Point | null) {
    // grab scale of selected layer
    const doc = getSelectedDoc();
    if (!doc) return;

    const selectedLayers = ui.selectedLayers[doc.id];
    if (selectedLayers.length === 1) {
        const layer = doc.layers.find(l => l.id === selectedLayers[0]);
        if (!layer) return;

        const handlePositions = getScaleHandlePositions(layer.transform.matrix, layer);
        
        // check if mouse is over any scale handle
        let overScaleHandle: ScaleDirection | null = null;
        for (const dir in handlePositions) {
            const pos = handlePositions[dir as ScaleDirection];
            if (Math.abs(c.x - pos.x) <= scaleHandleHitboxSize &&
                Math.abs(c.y - pos.y) <= scaleHandleHitboxSize) {
                overScaleHandle = dir as ScaleDirection;
                break;
            }
        }

        if (overScaleHandle) {
            selectState.action = { type: 'scale', direction: overScaleHandle };
            return;
        }

        // check if mouse is over rotate handle
        const rotateHandle = getRotateHandlePosition(layer.transform.matrix, layer);

        if (Math.abs(c.x - rotateHandle.x) <= rotateHandleHitboxSize &&
            Math.abs(c.y - rotateHandle.y) <= rotateHandleHitboxSize) {
            selectState.action = { type: 'rotate' };
            return;
        }

        // check if mouse is over non-transparent pixel
        const ctx = layer.type === 'canvas' ? layer.canvas.getContext('2d') : null;
        if (ctx && l) {
            const pixel = ctx.getImageData(l.x, l.y, 1, 1).data;
            if (pixel[3] > 0) {
                selectState.action = { type: 'move' };
                return;
            }
        }
    }

    selectState.action = { type: 'select' };
}

function getScaleHandlePositions(transform: DOMMatrix, layer: Layer): Record<ScaleDirection, Point> {
    const width = layer.type === 'canvas' ? layer.canvas.width : layer.width;
    const height = layer.type === 'canvas' ? layer.canvas.height : layer.height;

    // get the corners of the bounding box after transformation
    const corners = [
        new DOMPoint(0, 0).matrixTransform(transform), // top-left
        new DOMPoint(width, 0).matrixTransform(transform), // top-right
        new DOMPoint(width, height).matrixTransform(transform), // bottom-right
        new DOMPoint(0, height).matrixTransform(transform), // bottom-left
    ];

    return {
        nw: { x: corners[0].x, y: corners[0].y },
        ne: { x: corners[1].x, y: corners[1].y },
        se: { x: corners[2].x, y: corners[2].y },
        sw: { x: corners[3].x, y: corners[3].y },
        n: { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 },
        e: { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2 },
        s: { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2 },
        w: { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2 },
    };
}

function getRotateHandlePosition(
    transform: DOMMatrix,
    layer: Layer,
): Point {
    // get the top center of the bounding box after transformation
    const width = layer.type === 'canvas' ? layer.canvas.width : layer.width;
    const topCenter = new DOMPoint(width / 2, 0).matrixTransform(transform);

    // get a point just above the top center to determine the up direction
    const upSample = new DOMPoint(width / 2, -1).matrixTransform(transform);

    // calculate the vector from topCenter to upSample and normalize it
    let vx = upSample.x - topCenter.x;
    let vy = upSample.y - topCenter.y;
    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) {
        vx /= len;
        vy /= len;
    }

    // position the rotate handle some distance along this vector
    return {
        x: topCenter.x + vx * rotateHandleOffset,
        y: topCenter.y + vy * rotateHandleOffset,
    };
}

function getScalePivotPoint(direction: ScaleDirection, layer: Layer): Point {
    const width = layer.type === 'canvas' ? layer.canvas.width : layer.width;
    const height = layer.type === 'canvas' ? layer.canvas.height : layer.height;

    switch (direction) {
        case 'n': return { x: width / 2, y: height };
        case 's': return { x: width / 2, y: 0 };
        case 'e': return { x: 0, y: height / 2 };
        case 'w': return { x: width, y: height / 2 };
        case 'ne': return { x: 0, y: height };
        case 'nw': return { x: width, y: height };
        case 'se': return { x: 0, y: 0 };
        case 'sw': return { x: width, y: 0 };
    }
}

export default select;