import type { Tool, Point } from ".";
import docs from "../docs.svelte";
import ui from "../ui.svelte";
import { postAction } from "../action";
import draw from "./draw.svelte";
import { getSelectedDrawLayer, createStamp, interpolateStrokePoints, takeLayerSnapshot } from "./utils/brush";

export const erase = $state({
    erasing: false,
});

const stroke = {
    stamp: null as ImageData | null,
    start: { x: 0, y: 0 } as Point,
    current: { x: 0, y: 0 } as Point,
};

const drawLayer = $derived(getSelectedDrawLayer());

let layerSnapshot = null as ImageData | null;
const strokeCanvas = $derived(
    drawLayer
        ? new OffscreenCanvas(drawLayer.canvas.width, drawLayer.canvas.height)
        : null
);

function eraseStamp(p: Point) {
    if (!drawLayer || !strokeCanvas) return;
    const ctx = strokeCanvas.getContext('2d');
    if (!ctx) return;

    const color = drawLayer ? drawLayer.foregroundColor : { r: 0, g: 0, b: 0, a: 1 };

    // Draw line from stroke.start to p using stamp
    // adding rgb, but taking the max of alphas
    if (!stroke.stamp) return;

    const points = interpolateStrokePoints(stroke.current, p, draw.brushSize);
    for (const point of points) {
        const x = point.x;
        const y = point.y;

        const radius = draw.brushSize / 2;

        // Draw gradient to temp canvas
        const offsetX = x - radius;
        const offsetY = y - radius;

        // Get existing pixels from stroke canvas
        const existingData = ctx.getImageData(
            offsetX, offsetY,
            draw.brushSize, draw.brushSize
        );

        // blend: add rgb, max alpha
        for (let j = 0; j < existingData.data.length; j += 4) {
            const existingAlpha = existingData.data[j + 3];
            const newAlpha = stroke.stamp.data[j + 3] * color.a;
            const maxAlpha = Math.max(existingAlpha, newAlpha);
            
            if (maxAlpha > 0) {
                existingData.data[j] = 0;
                existingData.data[j + 1] = 0;
                existingData.data[j + 2] = 0;
                existingData.data[j + 3] = maxAlpha;
            }
        }

        ctx.putImageData(existingData, offsetX, offsetY);
    }

    // composite snapshot onto drawLayer.canvas
    const drawCtx = drawLayer.canvas.getContext('2d');
    if (!drawCtx) return;

    if (layerSnapshot) {
        drawCtx.putImageData(layerSnapshot, 0, 0);
    } else {
        drawCtx.clearRect(0, 0, drawLayer.canvas.width, drawLayer.canvas.height);
    }

    // apply erase from strokeCanvas
    drawCtx.globalCompositeOperation = 'destination-out';
    drawCtx.drawImage(strokeCanvas, 0, 0);
    drawCtx.globalCompositeOperation = 'source-over';
}

// ...existing code...

export const eraseTool: Tool = {
    name: 'erase',
    onPointerDown: (data) => {
        draw.drawing = true;

        if (data.l) {
            // if a layer is selected, ensure it's a canvas layer
            if (!ui.selectedDocument) return;
            const selectedLayers = ui.selected?.selectedLayers ?? [];
            if (selectedLayers.length === 0) return;

            if (!docs.selected) return;

            const layer = docs.selected.layers.find(l => l.id === selectedLayers[0]);
            if (!layer || layer.type !== 'canvas') return;
        }

        // set up stamp canvas
        const stampCanvas = new OffscreenCanvas(
            draw.brushSize, draw.brushSize
        );
        const stampCtx = stampCanvas.getContext('2d');

        stroke.stamp = createStamp(draw.brushSize, draw.brushFeather);
        layerSnapshot = takeLayerSnapshot(drawLayer);

        stroke.start = data.l ?? data.c;
        stroke.current = data.l ?? data.c;
        eraseStamp(stroke.start);
    },
    onPointerMove: (data) => {
        if (!draw.drawing || !data.l || !drawLayer) return;

        eraseStamp(data.l);
        stroke.current = data.l;

        if (!docs.selected) return;
        docs.selected.layers = [...docs.selected.layers];
    },
    onPointerUp: (data) => {
        if (!draw.drawing || !data.l || !drawLayer) return;
        
        eraseStamp(data.l);
        draw.drawing = false;
        stroke.current = data.l;
        stroke.stamp = null;

        // clear stroke canvas and snapshot
        const ctx = strokeCanvas?.getContext('2d');
        if (ctx && drawLayer) {
            ctx.clearRect(0, 0, drawLayer.canvas.width, drawLayer.canvas.height);
        }
        layerSnapshot = null;

        // force update
        if (!docs.selected) return;
        
        if (drawLayer) postAction({
            type: "content",
            layerID: drawLayer.id,
            newContent: drawLayer.canvas
                .getContext('2d')!
                .getImageData(0, 0, drawLayer.canvas.width, drawLayer.canvas.height)
        });
        docs.selected.layers = [...docs.selected.layers];
    }
}

export default draw;