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
});

function drawOnCanvas(p: Point) {
    if (!drawState.drawLayer) return;
    const canvas = drawState.drawLayer.canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
        
        drawState.drawing = false;
        drawState.current = data.l;

        const doc = getSelectedDoc();
        if (!doc) return;
        doc.layers = [...doc.layers];
    }
}

export default draw;