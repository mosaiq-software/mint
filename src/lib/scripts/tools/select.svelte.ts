import docs, { matrixToTransformComponents } from "../docs.svelte";
import ui from "../ui.svelte";
import type { Tool, Point } from ".";
import { translateLayerBy, type Layer, type LayerID } from "../layer";
import { postAction, type PostAction } from "../action";

const scaleHandleHitboxSize = 5;
const rotateHandleHitboxSize = 5;
const rotateHandleOffset = 25; // distance above the bounding box

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

type Bounds = {
    pos: Point,
    size: Point,
    rot: number
}

const select: {
    action: SelectAction,
    dragging: boolean,
    bounds: Bounds | null
} = $state({
    action: { type: 'select' },
    dragging: false,
    bounds: {
        pos: { x: 0, y: 0 },
        size: { x: 0, y: 0 },
        rot: 0
    }
});

const initial = {
    bounds: null as Bounds | null,
    matrices: {} as Record<LayerID, DOMMatrix>,
    sizes: {} as Record<LayerID, Point>,
    c: { x: 0, y: 0 } as Point
}

let previousSelectedLayerIDs: LayerID[] = [];
let previousRotation = 0;
export function updateBoundingBox() {
    console.log("Updating bounding box");
    const currentSelectedLayerIDs = ui.selected?.selectedLayers ?? [];

    // detect selection change
    if (previousSelectedLayerIDs.length !== currentSelectedLayerIDs.length ||
        !previousSelectedLayerIDs.every((id, index) => id === currentSelectedLayerIDs[index])) {
        // determine if all selected layers have the same rotation
        const rotations = ui.selectedLayers.map(layer => {
            const m = matrixToTransformComponents(layer.transform.matrix);
            return m.rotate;
        });

        // if all rotations are the same (within a small tolerance), use that rotation
        const allSameRotation = rotations.every(rot => Math.abs(rot-rotations[0]) < 0.01);
        previousRotation = allSameRotation ? rotations[0] : 0;
    }
    previousSelectedLayerIDs = [...currentSelectedLayerIDs];

    // handle no selection
    if (ui.selectedLayers.length === 0) {
        previousRotation = 0;
        select.bounds = null;
        return;
    }

    // handle multi-layer selection: compute bounding box around all selected layers
    const allCorners = ui.selectedLayers.flatMap(layer => {
        const width = layer.type === 'canvas' ? layer.canvas.width : layer.width;
        const height = layer.type === 'canvas' ? layer.canvas.height : layer.height;
        
        return [
            new DOMPoint(0, 0),
            new DOMPoint(width, 0),
            new DOMPoint(width, height),
            new DOMPoint(0, height)
        ].map(corner => layer.transform.matrix.transformPoint(corner));
    });

    // rotate corners to align with previous bounding box rotation
    const inverseRotation = new DOMMatrix().rotate(-previousRotation);
    const rotatedCorners = allCorners.map(corner => corner.matrixTransform(inverseRotation));

    // calculate bounding box of selected layers
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
        .rotate(previousRotation)
        .transformPoint(new DOMPoint(minX, minY));

    select.bounds = {
        pos: { x: topLeft.x, y: topLeft.y },
        size: { x: maxX - minX, y: maxY - minY },
        rot: previousRotation
    };
}

export const selectTool: Tool = {
    name: 'select',
    onPointerDown: (data) => {
        select.dragging = true;
        if (!docs.selected) return;

        if (select.action.type === 'select') {
            // traverse layers from top to bottom to find the first shape under the cursor
            let found: LayerID | null = null;
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
                        found = layer.id;
                        data.l = { x: point.x, y: point.y };
                        break;
                    }
                } else if ((layer.type === "text" || layer.type === "rectangle" || layer.type === "ellipse") && layer.visible) {
                    // convert point to layer space
                    const invMatrix = layer.transform.matrix.inverse();
                    const point = new DOMPoint(data.c.x, data.c.y).matrixTransform(invMatrix);

                    // check if point is within text bounding box
                    if (point.x >= 0 && point.x <= layer.width &&
                        point.y >= 0 && point.y <= layer.height) {
                        data.l = { x: point.x, y: point.y };
                        found = layer.id;
                        break;
                    }
                }
            }

            if (found) {
                setAction(data.v, data.c);
                if (ui.selected) {
                    if (data.e.shiftKey) {
                        if (!ui.selected.selectedLayers.includes(found)) {
                            ui.selected.selectedLayers = [
                                ...ui.selected.selectedLayers,
                                found
                            ];
                        } else {
                            ui.selected.selectedLayers = ui.selected.selectedLayers.filter(id => id !== found);
                        }
                    } else {
                        ui.selected.selectedLayers = [found];
                    }
                }
            } else if (ui.selected) {
                if (!data.e.shiftKey) ui.selected.selectedLayers = [];
            }
        } else {
            // store initial matrices for all selected layers
            initial.matrices = {};
            for (const layer of ui.selectedLayers) {
                initial.matrices[layer.id] = layer.transform.matrix.translate(0, 0);
                if (layer.type === 'rectangle' || layer.type === 'ellipse')
                    initial.sizes[layer.id] = { x: layer.width, y: layer.height };
            }

            // store initial bounds
            if (select.bounds) {
                initial.bounds = {
                    pos: { x: select.bounds.pos.x, y: select.bounds.pos.y },
                    size: { x: select.bounds.size.x, y: select.bounds.size.y },
                    rot: select.bounds.rot
                };
            }

            // store initial pointer position
            initial.c = { x: data.c.x, y: data.c.y }
        }
    },
    onPointerMove: (data) => {
        if (select.dragging) {
            if (!docs.selected) return;
            if (initial.bounds === null) return;

            if (select.action.type === 'move') {
                const dx = data.c.x - initial.c.x;
                const dy = data.c.y - initial.c.y;

                translateLayers(ui.selectedLayers, dx, dy);
            } else if (select.action.type === 'scale') {
                const dir = select.action.direction;

                // get pivot point in world space
                const matrix = new DOMMatrix()
                    .translate(initial.bounds.pos.x, initial.bounds.pos.y)
                    .rotate(initial.bounds.rot);
                const pivot = getScalePivotPoint(dir, initial.bounds.size.x, initial.bounds.size.y);
                const pivotWorld = new DOMPoint(pivot.x, pivot.y).matrixTransform(matrix);

                // translate initial and current pointer positions to pivot space
                const rotMatrix = new DOMMatrix().rotate(-initial.bounds.rot)
                const initialVector = new DOMPoint(initial.c.x, initial.c.y).matrixTransform(rotMatrix);
                const currentVector = new DOMPoint(data.c.x, data.c.y).matrixTransform(rotMatrix);

                // calculate scale factors
                const dx = currentVector.x - initialVector.x;
                const dy = currentVector.y - initialVector.y;
                let scaleX = (initial.bounds.size.x + (dir.includes('e') ? dx : (dir.includes('w') ? -dx : 0))) / initial.bounds.size.x;
                let scaleY = (initial.bounds.size.y + (dir.includes('s') ? dy : (dir.includes('n') ? -dy : 0))) / initial.bounds.size.y;

                if (ui.selectedLayers.length > 1) {
                    // for multiple layers, constrain to uniform scale
                    let uniformScale;
                    if (dir === 'n' || dir === 's')  uniformScale = scaleY;
                    else if (dir === 'e' || dir === 'w') uniformScale = scaleX;
                    else uniformScale = (scaleX + scaleY) / 2;
                    scaleX = uniformScale;
                    scaleY = uniformScale;
                }

                scaleLayers(ui.selectedLayers, scaleX, scaleY, pivotWorld, initial.bounds.rot);
            } else if (select.action.type === 'rotate') {
                // get angle delta relative to center of initial bounds,
                // taking into account bounds rotation
                const matrix = new DOMMatrix()
                    .translate(initial.bounds.pos.x, initial.bounds.pos.y)
                    .rotate(initial.bounds.rot);
                const center = new DOMPoint(
                    initial.bounds.size.x / 2,
                    initial.bounds.size.y / 2
                ).matrixTransform(matrix);

                const angle = Math.atan2(data.c.y - center.y, data.c.x - center.x) * (180 / Math.PI) + 90;
                const angleDelta = angle - initial.bounds.rot;

                rotateLayers(ui.selectedLayers, angleDelta, center);

                if (select.bounds) select.bounds.rot = angle;
                previousRotation = angle;
            }
        } else {
            // determine action based on mouse position
            setAction(data.v, data.c);
        }
    },
    onPointerUp: (data) => {
        select.dragging = false;

        // if action is scale/move/rotate, record post-action state
        if (docs.selected) {
            const actions: PostAction[] = []
            for (const layer of ui.selectedLayers) {
                if (select.action.type === 'move' || select.action.type === 'rotate') {
                    actions.push({
                        type: "transform",
                        layerID: layer.id,
                        newMatrix: layer.transform.matrix,
                    });
                } else if (select.action.type === 'scale') {
                    if (layer.type === 'rectangle' || layer.type === 'ellipse') {
                        actions.push({
                            type: "update",
                            layerID: layer.id,
                            newLayer: {
                                width: layer.width,
                                height: layer.height
                            }
                        });
                    } else {
                        actions.push({
                            type: "transform",
                            layerID: layer.id,
                            newMatrix: layer.transform.matrix,
                        }); 
                    }
                }
            }

            if (actions.length > 0) {
                postAction({
                    type: "compound",
                    actions: actions
                });
            }
        }

        // after mouse up, determine action based on mouse position
        setAction(data.v, data.c);
    },
    onKeyDown: (e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            if (!docs.selected) return;
            if (ui.selectedLayers.length === 0) return;

            // remove selected layers from the document
            const actions: PostAction[] = [];
            for (const layer of ui.selectedLayers) {
                const layerIndex = docs.selected.layers.findIndex(l => l.id === layer.id);
                if (layerIndex !== -1) {
                    docs.selected.layers.splice(layerIndex, 1);

                    actions.push({
                        type: "delete",
                        layer: layer,
                        position: layerIndex,
                    });
                }
            }

            if (actions.length > 0) {
                postAction({
                    type: "compound",
                    actions: actions
                });
            }
            
            if (ui.selected) ui.selected.selectedLayers = [];
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            if (!docs.selected) return;
            e.preventDefault();

            if (ui.selectedLayers.length === 0) return;

            const delta = e.shiftKey ? 10 : 1;
            let dx = 0;
            let dy = 0;
            if (e.key === 'ArrowUp') dy = -delta;
            else if (e.key === 'ArrowDown') dy = delta;
            else if (e.key === 'ArrowLeft') dx = -delta;
            else if (e.key === 'ArrowRight') dx = delta;

            const actions: PostAction[] = [];
            for (const layer of ui.selectedLayers) {
                translateLayerBy(layer, dx, dy);
                actions.push({
                    type: "transform",
                    layerID: layer.id,
                    newMatrix: layer.transform.matrix,
                });
            }

            if (actions.length > 0) {
                postAction({
                    type: "compound",
                    actions: actions
                });
            }
        } else if (e.key === '=') {
            if (ui.selected) ui.selected.zoom *= 1.1;
        } else if (e.key === '-') {
            if (ui.selected) ui.selected.zoom /= 1.1;
        }
    }
}

function setAction(v: Point, c: Point) {
    if (!docs.selected) return;

    if (select.bounds) {
        const matrix = new DOMMatrix()
            .translate(select.bounds.pos.x, select.bounds.pos.y)
            .rotate(select.bounds.rot);
        
        const handlePositions = getScaleHandlePositions(matrix, select.bounds.size.x, select.bounds.size.y);
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
        const rotateHandle = getRotateHandlePosition(matrix, select.bounds.size.x);
        const dist = Math.hypot(v.x - rotateHandle.x, v.y - rotateHandle.y);
        if (dist < rotateHandleHitboxSize) {
            select.action = { type: 'rotate' };
            return;
        }

        // check if mouse is within bounds
        const invMatrix = matrix.inverse();
        const c_rot = new DOMPoint(c.x, c.y).matrixTransform(invMatrix);

        if (c_rot.x >= 0 && c_rot.x <= select.bounds.size.x &&
            c_rot.y >= 0 && c_rot.y <= select.bounds.size.y) {
            select.action = { type: 'move' };
            return;
        }
    }

    select.action = { type: 'select' };
}

function getScaleHandlePositions(transform: DOMMatrix, width: number, height: number): Record<ScaleDirection, Point> {
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
        n: { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 },
        e: { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2 },
        s: { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2 },
        w: { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2 },
    };
}

function getRotateHandlePosition(transform: DOMMatrix, width: number): Point {
    // get the top center of the bounding box after transformation
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

function getScalePivotPoint(direction: ScaleDirection, width: number, height: number): Point {
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

function translateLayers(layers: Layer[], dx: number, dy: number) {
    for (const layer of layers) {
        const initialMatrix = initial.matrices[layer.id];
        const mat = initialMatrix.translate(0, 0);
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

        layer.transform.matrix = initialMatrix.translate(localDx, localDy);
    }
}

function rotateLayers(layers: Layer[], angle: number, pivot: Point) {
    for (const layer of layers) {
        layer.transform.matrix = new DOMMatrix()
            .translate(pivot.x, pivot.y)
            .rotate(angle)
            .translate(-pivot.x, -pivot.y)
            .multiply(initial.matrices[layer.id]);
    }
}

function scaleLayers(layers: Layer[], scaleX: number, scaleY: number, pivot: Point, angle: number) {
    for (const layer of layers) {
        // apply scale around pivot point
        layer.transform.matrix = new DOMMatrix()
            .translate(pivot.x, pivot.y)
            .rotate(angle)
            .scale(scaleX, scaleY)
            .rotate(-angle)
            .translate(-pivot.x, -pivot.y)
            .multiply(initial.matrices[layer.id]);

        if (layer.type === 'rectangle' || layer.type === 'ellipse') {
            // apply scale to width/height instead of matrix
            const m = matrixToTransformComponents(layer.transform.matrix);
            const initialWidth = initial.sizes[layer.id].x;
            const initialHeight = initial.sizes[layer.id].y;
            layer.width = (initialWidth * m.scale.x);
            layer.height = (initialHeight * m.scale.y);

            // reset scale to 1
            layer.transform.matrix = new DOMMatrix()
                .translate(m.translate.x, m.translate.y)
                .rotate(m.rotate);
        }
    }
}

export default select;