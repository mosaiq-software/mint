import type { Tool } from ".";
import { getSelectedDoc } from "../docs.svelte";
import type { Point } from ".";
import ui from "../ui.svelte";

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
});

const scaleHandleHitboxSize = 3;
const rotateHandleHitboxSize = 3;
const rotateHandleOffset = 25; // distance above the bounding box

const select: Tool = {
    name: 'select',
    onPointerDown: (data) => {
        selectState.dragging = true;

        if (selectState.action.type === 'select') {
            // traverse layers from top to bottom to find the first shape under the cursor
            const doc = getSelectedDoc();
            if (!doc) return;

            let found = false;
            for (let i = doc.layers.length - 1; i >= 0; i--) {
                const layer = doc.layers[i];
                if (layer.type === 'canvas' && layer.visible) {
                    // sample canvas pixel at data.c
                    const ctx = layer.canvas.getContext('2d');
                    if (!ctx) continue;
                    const pixel = ctx.getImageData(data.c.x, data.c.y, 1, 1).data;

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
        }
    },
    onPointerMove: (data) => {
        if (selectState.dragging) {
            // todo: handle dragging based on selectState.action
            return;
        }

        // determine action based on mouse position
        setAction(data.c);
    },
    onPointerUp: (data) => {
        selectState.dragging = false;

        // after mouse up, determine action based on mouse position
        setAction(data.c);

        console.log("Select tool mouse up at", data.l);
    }   
}

function setAction(c: Point) {
    // grab scale of selected layer
    const doc = getSelectedDoc();
    if (!doc) return;

    const selectedLayers = ui.selectedLayers[doc.id];
    if (selectedLayers.length === 1) {
        const layer = doc.layers.find(l => l.id === selectedLayers[0]);
        if (!layer) return;

        const handlePositions = getScaleHandlePositions(layer.transform.matrix);
        
        // check if mouse is over any scale handle
        let overScaleHandle: ScaleDirection | null = null;
        for (const dir in handlePositions) {
            const pos = handlePositions[dir as ScaleDirection];
            if (Math.abs(c.x - pos.x * doc.width) <= scaleHandleHitboxSize &&
                Math.abs(c.y - pos.y * doc.height) <= scaleHandleHitboxSize) {
                overScaleHandle = dir as ScaleDirection;
                break;
            }
        }

        if (overScaleHandle) {
            selectState.action = { type: 'scale', direction: overScaleHandle };
            return;
        }

        // check if mouse is over rotate handle
        const rotateHandle = getRotateHandlePosition(layer.transform.matrix, doc.height);

        if (Math.abs(c.x - rotateHandle.x * doc.width) <= rotateHandleHitboxSize &&
            Math.abs(c.y - rotateHandle.y * doc.height) <= rotateHandleHitboxSize) {
            selectState.action = { type: 'rotate' };
            return;
        }

        // check if mouse is over non-transparent pixel
        const ctx = layer.type === 'canvas' ? layer.canvas.getContext('2d') : null;
        if (ctx) {
            const pixel = ctx.getImageData(c.x, c.y, 1, 1).data;
            if (pixel[3] > 0) {
                selectState.action = { type: 'move' };
                return;
            }
        }
    }

    selectState.action = { type: 'select' };
}

function getScaleHandlePositions(transform: DOMMatrix): Record<ScaleDirection, { x: number; y: number }> {
    // get the corners of the bounding box after transformation
    const corners = [
        new DOMPoint(0, 0).matrixTransform(transform), // top-left
        new DOMPoint(1, 0).matrixTransform(transform), // top-right
        new DOMPoint(1, 1).matrixTransform(transform), // bottom-right
        new DOMPoint(0, 1).matrixTransform(transform), // bottom-left
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
    docHeight: number
): { x: number; y: number } {
    const point = new DOMPoint(0.5, -rotateHandleOffset / docHeight).matrixTransform(transform);
    return { x: point.x, y: point.y };
}

export default select;