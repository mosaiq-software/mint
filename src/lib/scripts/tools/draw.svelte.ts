import type { Tool, Point } from ".";
import docs, { getSelectedDoc, colorToCSS } from "../docs.svelte";
import ui from "../ui.svelte";
import { createLayer, type CanvasLayer } from "../layer";

export const draw = $state({
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
    if (!draw.drawLayer) return;
    const canvas = draw.drawLayer.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (draw.brushFeather > 0) {
        // Draw line from draw.start to p using stamp
        // adding rgb, but taking the max of alphas
        if (!draw.stampCtx || !draw.stampCanvas) return;

        const dist = Math.hypot(p.x - draw.current.x, p.y - draw.current.y);
        const steps = Math.max(Math.ceil(dist / (draw.brushSize / 24)), 1);
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const x = draw.current.x + (p.x - draw.current.x) * t;
            const y = draw.current.y + (p.y - draw.current.y) * t;

            const radius = draw.brushSize / 2;

            // Draw gradient to temp canvas
            const offsetX = x - radius;
            const offsetY = y - radius;

            // Get existing pixels from stroke canvas
            const existingData = ctx.getImageData(
                offsetX, offsetY,
                draw.brushSize, draw.brushSize
            );
            const newData = draw.stampCtx.getImageData(
                0, 0,
                draw.brushSize, draw.brushSize
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
        ctx.lineWidth = draw.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(draw.current.x, draw.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.closePath();
    }
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
            ui.selectedLayers[doc.id].push(newLayer.id);

            draw.drawLayer = newLayer;
        } else {
            // if a layer is selected, ensure it's a canvas layer
            if (!ui.selectedDocument) return;
            const selectedLayers = ui.selectedLayers[ui.selectedDocument || ''];
            if (selectedLayers.length === 0) return;

            const doc = getSelectedDoc();
            if (!doc) return;

            const layer = doc.layers.find(l => l.id === selectedLayers[0]);
            if (!layer || layer.type !== 'canvas') return;

            draw.drawLayer = layer;
        }

        // set up stamp canvas
        draw.stampCanvas = new OffscreenCanvas(
            draw.brushSize, draw.brushSize
        );
        draw.stampCtx = draw.stampCanvas.getContext('2d');

        // Pre-draw the stamp
        if (draw.stampCtx) {
            const radius = draw.brushSize / 2;
            const feather = draw.brushFeather;
            const gradient = draw.stampCtx.createRadialGradient(
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

            draw.stampCtx.fillStyle = gradient;
            draw.stampCtx.fillRect(
                0, 0,
                draw.brushSize, draw.brushSize
            );
        }

        draw.start = data.l ?? data.c;
        draw.current = data.l ?? data.c;
        drawOnCanvas(draw.start);
    },
    onPointerMove: (data) => {
        if (!draw.drawing || !data.l || !draw.drawLayer) return;

        drawOnCanvas(data.l);
        draw.current = data.l;

        const doc = getSelectedDoc();
        if (!doc) return;
        doc.layers = [...doc.layers];
    },
    onPointerUp: (data) => {
        if (!draw.drawing || !data.l || !draw.drawLayer) return;
        
        drawOnCanvas(data.l);
        draw.drawing = false;
        draw.current = data.l;

        const doc = getSelectedDoc();
        if (!doc) return;
        doc.layers = [...doc.layers];
    }
}

export default draw;