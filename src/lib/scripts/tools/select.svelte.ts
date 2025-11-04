import type { Tool } from ".";
import docs, {matrixToTransformComponents} from "../docs.svelte";
import type { Point } from ".";
import ui from "../ui.svelte";
import {translateLayerBy, type Layer } from "../layer";
import { postAction } from "../action";

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

const select = $state({
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

const scaleHandleHitboxSize = 5;
const rotateHandleHitboxSize = 5;
const rotateHandleOffset = 25; // distance above the bounding box

export const selectTool: Tool = {
    name: 'select',
    onPointerDown: (data) => {
        select.dragging = true;

        if (!docs.selected) return;

        const selectedLayers = ui.selected?.selectedLayers ?? [];
        const firstSelectedLayer = selectedLayers.length > 0 ?
            docs.selected.layers.find(l => l.id === selectedLayers[0]) : null;

        if (select.action.type === 'select') {
            // traverse layers from top to bottom to find the first shape under the cursor
            let found = false;
            for (let i = docs.selected.layers.length - 1; i >= 0; i--) {
                const layer = docs.selected.layers[i];
                if (layer.type === 'canvas' && layer.visible) {
                    // sample canvas pixel at data.c, transformed to layer space
                    const ctx = layer.canvas.getContext('2d');
                    if (!ctx) continue;

                    const invMatrix = layer.transform.matrix.inverse();
                    const point = new DOMPoint(data.c.x, data.c.y).matrixTransform(invMatrix);
                    const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;

                    // if pixel is not transparent, select this layer
                    if (pixel[3] > 0) {
                        if (ui.selected) ui.selected.selectedLayers = [layer.id];
                        found = true;
                        data.l = { x: point.x, y: point.y };
                        break;
                    }
                } else if (layer.type === "text" && layer.visible) {
                    // convert point to layer space
                    const invMatrix = layer.transform.matrix.inverse();
                    const point = new DOMPoint(data.c.x, data.c.y).matrixTransform(invMatrix);

                    // check if point is within text bounding box
                    if (point.x >= 0 && point.x <= layer.width &&
                        point.y >= 0 && point.y <= layer.height) {
                        if (ui.selected) ui.selected.selectedLayers = [layer.id];
                        data.l = { x: point.x, y: point.y };
                        found = true;
                        break;
                    }
                }
            }

            if (found) {
                setAction(data.v, data.l);
            } else if (ui.selected) {
                ui.selected.selectedLayers = [];
            }
        } else if (select.action.type === 'scale') {
            if (firstSelectedLayer) {
                select.initial.pivot = getScalePivotPoint(select.action.direction, firstSelectedLayer);
            }
        }

        if (firstSelectedLayer) {
            select.initial.matrix = firstSelectedLayer.transform.matrix.translate(0, 0);
            console.log(matrixToTransformComponents(select.initial.matrix));
        }

        select.previous.c = data.c;
        if (data.l) select.initial.l = data.l;
    },
    onPointerMove: (data) => {
        if (select.dragging) {
            if (!docs.selected) return;

            if (select.action.type === 'move') {
                const selectedLayers = ui.selected?.selectedLayers ?? [];
                if (selectedLayers.length === 0) return;

                // move all selected layers by the delta
                let deltaX = data.c.x - select.previous.c.x;
                let deltaY = data.c.y - select.previous.c.y;

                for (const layerId of selectedLayers) {
                    const layer = docs.selected.layers.find(l => l.id === layerId);
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
            } else if (select.action.type === 'scale') {
                const dir = select.action.direction;

                // find the selected layer
                const selectedLayers = ui.selected?.selectedLayers ?? [];
                if (selectedLayers.length !== 1) return;
                const layer = docs.selected.layers.find(l => l.id === selectedLayers[0]);
                if (!layer) return;
                if (!data.l) return;

                // calculate current point in initial layer space
                const currentPoint = new DOMPoint(data.c.x, data.c.y)
                    .matrixTransform(select.initial.matrix.inverse());
                if (isNaN(currentPoint.x) || isNaN(currentPoint.y)) return;

                // calculate scale factor based on mouse movement and scale direction
                const deltaX = currentPoint.x - select.initial.l.x;
                const deltaY = currentPoint.y - select.initial.l.y;
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
                const { x: px, y: py } = select.initial.pivot;
                layer.transform.matrix = select.initial.matrix
                    .translate(px, py)
                    .scale(scaleX, scaleY)
                    .translate(-px, -py);
            } else if (select.action.type === 'rotate') {
                // find the selected layer
                const selectedLayers = ui.selected?.selectedLayers ?? [];
                if (selectedLayers.length !== 1) return;
                const layer = docs.selected.layers.find(l => l.id === selectedLayers[0]);
                if (!layer) return;
                if (!data.l) return;

                const layerWidth = (layer.type === 'canvas' ? layer.canvas.width : layer.width);
                const layerHeight = (layer.type === 'canvas' ? layer.canvas.height : layer.height);

                // compute the center in local and world space
                const localCenter = new DOMPoint(layerWidth / 2, layerHeight / 2);
                const worldCenter = localCenter.matrixTransform(select.initial.matrix);

                // calculate angle delta based on mouse movement
                const currentPoint = new DOMPoint(data.c.x, data.c.y);
                const delta = {
                    x: currentPoint.x - worldCenter.x,
                    y: currentPoint.y - worldCenter.y
                }

                let currentAngle = Math.atan2(delta.y, delta.x) + Math.PI / 2;

                // decompose scale from the initial matrix
                const m = select.initial.matrix;
                const comps = matrixToTransformComponents(m);
                const {scale: {x: scaleX, y: scaleY}} = comps;

                // offset iff mirrored
                if (scaleY < 0) currentAngle += Math.PI;

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
            setAction(data.v, data.l);
        }

        select.previous.c = data.c;
    },
    onPointerUp: (data) => {
        select.dragging = false;

        // if action is scale/move/rotate, record post-action state
        if (docs.selected) {
            const selectedLayers = ui.selected?.selectedLayers ?? [];
            const firstSelectedLayer = docs.selected.layers.find(l => l.id === selectedLayers[0]);
            if (firstSelectedLayer) {
                if (select.action.type === 'move' || select.action.type === 'scale' || select.action.type === 'rotate') {
                    postAction({
                        type: "transform",
                        layerID: firstSelectedLayer.id,
                        newMatrix: firstSelectedLayer.transform.matrix,
                    });
                }
            }
        }

        // after mouse up, determine action based on mouse position
        setAction(data.c, data.l);
    },
    onKeyDown: (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            if (!docs.selected) return;

            const selectedLayers = ui.selected?.selectedLayers ?? [];
            if (selectedLayers.length === 0) return;

            // remove selected layers from the document
            for (const layerId of selectedLayers) {
                const layerIndex = docs.selected.layers.findIndex(l => l.id === layerId);
                if (layerIndex !== -1) {
                    const layer = docs.selected.layers[layerIndex];
                    docs.selected.layers.splice(layerIndex, 1);

                    postAction({
                        type: "delete",
                        layer: layer,
                        position: layerIndex,
                    });
                }
            }
            
            if (ui.selected) ui.selected.selectedLayers = [];
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if (!docs.selected) return;

            const selectedLayers = ui.selected?.selectedLayers ?? [];
            if (selectedLayers.length === 0) return;

            const delta = e.shiftKey ? 10 : 1;
            let dx = 0;
            let dy = 0;
            if (e.key === 'ArrowUp') dy = -delta;
            else if (e.key === 'ArrowDown') dy = delta;
            else if (e.key === 'ArrowLeft') dx = -delta;
            else if (e.key === 'ArrowRight') dx = delta;

            for (const layerId of selectedLayers) {
                const layer = docs.selected.layers.find(l => l.id === layerId);
                if (layer) {
                    translateLayerBy(layer, dx, dy);
                    postAction({
                        type: "transform",
                        layerID: layer.id,
                        newMatrix: layer.transform.matrix,
                    })
                }
            }         
        } else if (e.key === '=') {
            if (ui.selected) ui.selected.zoom *= 1.1;
        } else if (e.key === '-') {
            if (ui.selected) ui.selected.zoom /= 1.1;
        }
    }
}

function setAction(v: Point, l: Point | null) {
    // grab scale of selected layer
    if (!docs.selected) return;

    const selectedLayers = ui.selected?.selectedLayers ?? [];
    if (selectedLayers.length === 1) {
        const layer = docs.selected.layers.find(l => l.id === selectedLayers[0]);
        if (!layer) return;

        const handlePositions = getScaleHandlePositions(layer.transform.matrix, layer);
        
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
            select.action = { type: 'scale', direction: overScaleHandle };
            return;
        }

        // check if mouse is over rotate handle
        const rotateHandle = getRotateHandlePosition(layer.transform.matrix, layer);
        const dist = Math.hypot(v.x - rotateHandle.x, v.y - rotateHandle.y);
        if (dist < rotateHandleHitboxSize) {
            select.action = { type: 'rotate' };
            return;
        }

        // check if mouse is within layer bounds
        const width = layer.type === 'canvas' ? layer.canvas.width : layer.width;
        const height = layer.type === 'canvas' ? layer.canvas.height : layer.height;
        if (l && l.x >= 0 && l.x <= width && l.y >= 0 && l.y <= height) {
            select.action = { type: 'move' };
            return;
        }
    }

    select.action = { type: 'select' };
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
    const zoom = ui.selected?.zoom ?? 1;
    return {
        x: topCenter.x * zoom + vx * rotateHandleOffset,
        y: topCenter.y * zoom + vy * rotateHandleOffset,
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