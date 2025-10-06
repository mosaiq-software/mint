import type { Tool, Point } from ".";
import docs, { getSelectedDoc, colorToCSS } from "../docs.svelte";
import ui from "../ui.svelte";
import { createLayer, type CanvasLayer } from "../layer";

export const drawState = $state({
    drawing: false,
    start: { x: 0, y: 0 } as Point,
    current: { x: 0, y: 0 } as Point,
    brushSize: 10,
    brushFeather: 0,
    drawLayer: null as CanvasLayer | null,
    stampCanvas: null as OffscreenCanvas | null,
    stampCtx: null as OffscreenCanvasRenderingContext2D | null,
});

function drawOnCanvas(p: Point) {
    if (!drawState.drawLayer) return;
    const canvas = drawState.drawLayer.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (drawState.brushFeather > 0) {
        // Draw line from drawState.start to p using stamp
        // adding rgb, but taking the max of alphas
        if (!drawState.stampCtx || !drawState.stampCanvas) return;

        const dist = Math.hypot(p.x - drawState.current.x, p.y - drawState.current.y);
        const steps = Math.ceil(dist / (drawState.brushSize / 10));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = drawState.current.x + (p.x - drawState.current.x) * t;
            const y = drawState.current.y + (p.y - drawState.current.y) * t;

            const radius = drawState.brushSize / 2;

            // Draw gradient to temp canvas
            const offsetX = x - radius;
            const offsetY = y - radius;

            // Get existing pixels from stroke canvas
            const existingData = ctx.getImageData(
                offsetX, offsetY,
                drawState.brushSize, drawState.brushSize
            );
            const newData = drawState.stampCtx.getImageData(
                0, 0,
                drawState.brushSize, drawState.brushSize
            );

            // Blend: add RGB, max alpha
            for (let j = 0; j < existingData.data.length; j += 4) {
                const existingAlpha = existingData.data[j + 3] / 255;
                const newAlpha = newData.data[j + 3] / 255;
                const maxAlpha = Math.max(existingAlpha, newAlpha);
                
                if (maxAlpha > 0) {
                    // Blend colors proportionally to their alphas
                    existingData.data[j] = Math.min(255, existingData.data[j] + newData.data[j]);
                    existingData.data[j + 1] = Math.min(255, existingData.data[j + 1] + newData.data[j + 1]);
                    existingData.data[j + 2] = Math.min(255, existingData.data[j + 2] + newData.data[j + 2]);
                    existingData.data[j + 3] = maxAlpha * 255;
                }
            }

            ctx.putImageData(existingData, offsetX, offsetY);
        }
    } else {
        // draw a line from current to p
        ctx.strokeStyle = colorToCSS(ui.foregroundColor);
        ctx.lineWidth = drawState.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(drawState.current.x, drawState.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.closePath();
    }
}

// ...existing code...

const draw: Tool = {
    name: 'draw',
    onPointerDown: (data) => {
        drawState.drawing = true;

        if (!data.l) {
            const newLayer = createLayer('canvas', 'New Layer') as CanvasLayer;
            const doc = getSelectedDoc();
            if (!doc) return;

            doc.layers = [...doc.layers, newLayer];
            ui.selectedLayers[doc.id].push(newLayer.id);

            drawState.drawLayer = newLayer;
        } else {
            // if a layer is selected, ensure it's a canvas layer
            if (!ui.selectedDocument) return;
            const selectedLayers = ui.selectedLayers[ui.selectedDocument || ''];
            if (selectedLayers.length === 0) return;

            const doc = getSelectedDoc();
            if (!doc) return;

            const layer = doc.layers.find(l => l.id === selectedLayers[0]);
            if (!layer || layer.type !== 'canvas') return;

            drawState.drawLayer = layer;
        }

        // set up stamp canvas
        drawState.stampCanvas = new OffscreenCanvas(
            drawState.brushSize, drawState.brushSize
        );
        drawState.stampCtx = drawState.stampCanvas.getContext('2d');

        // Pre-draw the stamp
        if (drawState.stampCtx) {
            const radius = drawState.brushSize / 2;
            const feather = drawState.brushFeather;
            const gradient = drawState.stampCtx.createRadialGradient(
                radius, radius, 0,
                radius, radius, radius
            );

            const color = colorToCSS(ui.foregroundColor);
            const rgb = color.match(/\d+/g);
            if (rgb) {
                gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
                gradient.addColorStop(1 - feather, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`);
                gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
            }

            drawState.stampCtx.fillStyle = gradient;
            drawState.stampCtx.fillRect(
                0, 0,
                drawState.brushSize, drawState.brushSize
            );
        }

        drawState.start = data.l ?? data.c;
        drawState.current = data.l ?? data.c;
        drawOnCanvas(drawState.start);
    },
    onPointerMove: (data) => {
        if (!drawState.drawing || !data.l || !drawState.drawLayer) return;

        drawOnCanvas(data.l);
        drawState.current = data.l;

        const doc = getSelectedDoc();
        if (!doc) return;
        doc.layers = [...doc.layers];
    },
    onPointerUp: (data) => {
        if (!drawState.drawing || !data.l || !drawState.drawLayer) return;
        
        drawOnCanvas(data.l);
        drawState.drawing = false;
        drawState.current = data.l;

        const doc = getSelectedDoc();
        if (!doc) return;
        doc.layers = [...doc.layers];
    }
}

export default draw;