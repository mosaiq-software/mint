import type { Tool, Point } from ".";
import { getSelectedDoc, colorToCSS } from "../docs.svelte";
import ui from "../ui.svelte";
import { createLayer, type CanvasLayer } from "../layer";

export const draw = $state({
    drawing: false,
    brushSize: 10,
    brushFeather: 0
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

function drawOnCanvas(p: Point) {
    if (!drawLayer || !strokeCanvas) return;
    const ctx = strokeCanvas.getContext('2d');
    if (!ctx) return;

    const color = drawLayer ? drawLayer.foregroundColor : ui.foregroundColor;

    // Draw line from stroke.start to p using stamp
    // adding rgb, but taking the max of alphas
    if (!stroke.stamp) return;

    const dist = Math.hypot(p.x - stroke.current.x, p.y - stroke.current.y);
    const steps = Math.max(Math.ceil(dist / (draw.brushSize / 24)), 1);
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = stroke.current.x + (p.x - stroke.current.x) * t;
        const y = stroke.current.y + (p.y - stroke.current.y) * t;

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
                existingData.data[j] = color.r;
                existingData.data[j + 1] = color.g;
                existingData.data[j + 2] = color.b;
                existingData.data[j + 3] = maxAlpha;
            }
        }

        ctx.putImageData(existingData, offsetX, offsetY);
    }

    // composite snapshot and strokeCanvas onto drawLayer.canvas
    const drawCtx = drawLayer.canvas.getContext('2d');
    if (!drawCtx) return;

    if (layerSnapshot) {
        drawCtx.putImageData(layerSnapshot, 0, 0);
    } else {
        drawCtx.clearRect(0, 0, drawLayer.canvas.width, drawLayer.canvas.height);
    }
    drawCtx.drawImage(strokeCanvas, 0, 0);
}

// ...existing code...

export const drawTool: Tool = {
    name: 'draw',
    onPointerDown: (data) => {
        draw.drawing = true;

        if (!data.l) {
            const newLayer = createLayer('canvas', 'New Layer') as CanvasLayer;
            const doc = getSelectedDoc();
            if (!doc) return;

            doc.layers = [...doc.layers, newLayer];
            ui.selectedLayers[doc.id] = [newLayer.id];
        } else {
            // if a layer is selected, ensure it's a canvas layer
            if (!ui.selectedDocument) return;
            const selectedLayers = ui.selectedLayers[ui.selectedDocument || ''];
            if (selectedLayers.length === 0) return;

            const doc = getSelectedDoc();
            if (!doc) return;

            const layer = doc.layers.find(l => l.id === selectedLayers[0]);
            if (!layer || layer.type !== 'canvas') return;
        }

        // set up stamp canvas
        const stampCanvas = new OffscreenCanvas(
            draw.brushSize, draw.brushSize
        );
        const stampCtx = stampCanvas.getContext('2d');

        // pre-draw the stamp
        if (stampCtx) {
            const radius = draw.brushSize / 2;
            const feather = draw.brushFeather;
            const gradient = stampCtx.createRadialGradient(
                radius, radius, 0,
                radius, radius, radius
            );

            if (feather === 0) {
                gradient.addColorStop(0.9, `rgba(0, 0, 0, 1)`);
                gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
            } else {
                gradient.addColorStop(1 - feather, `rgba(0, 0, 0, 1)`);
                gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);
            }

            stampCtx.fillStyle = gradient;
            stampCtx.fillRect(
                0, 0,
                draw.brushSize, draw.brushSize
            );
            stroke.stamp = stampCtx.getImageData(
                0, 0,
                draw.brushSize, draw.brushSize
            );
        }

        // take a snapshot of the layer
        if (drawLayer && !layerSnapshot) {
            const ctx = drawLayer.canvas.getContext('2d');
            if (ctx) {
                layerSnapshot = ctx.getImageData(
                    0, 0,
                    drawLayer.canvas.width,
                    drawLayer.canvas.height
                );
            }
        }

        stroke.start = data.l ?? data.c;
        stroke.current = data.l ?? data.c;
        drawOnCanvas(stroke.start);
    },
    onPointerMove: (data) => {
        if (!draw.drawing || !data.l || !drawLayer) return;

        drawOnCanvas(data.l);
        stroke.current = data.l;

        const doc = getSelectedDoc();
        if (!doc) return;
        doc.layers = [...doc.layers];
    },
    onPointerUp: (data) => {
        if (!draw.drawing || !data.l || !drawLayer) return;
        
        drawOnCanvas(data.l);
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
        const doc = getSelectedDoc();
        if (!doc) return;
        doc.layers = [...doc.layers];
    }
}

export function getSelectedDrawLayer() {
    const doc = getSelectedDoc();
    if (!doc) return null;

    const selectedLayerIds = ui.selectedLayers[doc.id]
    if (selectedLayerIds.length !== 1) return null;
    const selectedLayerId = selectedLayerIds[0];

    const layer = doc.layers.find(l => l.id === selectedLayerId);
    if (layer?.type !== 'canvas') return null;
    
    return layer;
}

export default draw;