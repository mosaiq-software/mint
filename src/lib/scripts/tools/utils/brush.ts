import type { Point } from "..";
import docs from "../../docs.svelte";
import ui from "../../ui.svelte";

export function createStamp(size: number, feather: number): ImageData {
    const stampCanvas = new OffscreenCanvas(size, size);
    const ctx = stampCanvas.getContext('2d')!;
    const radius = size / 2;
    const gradient = ctx.createRadialGradient(
        radius, radius, 0,
        radius, radius, radius
    );

    if (feather === 0) {
        const antiAliasSize = size < 3 ? 1 : 2 / size;
        gradient.addColorStop(1 - antiAliasSize, `rgba(0,0,0,1)`);
        gradient.addColorStop(1, `rgba(0,0,0,0)`);
    } else {
        gradient.addColorStop(1 - feather, `rgba(0,0,0,1)`);
        gradient.addColorStop(1, `rgba(0,0,0,0)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return ctx.getImageData(0, 0, size, size);
}

export function takeLayerSnapshot(layer: any): ImageData | null {
    const ctx = layer?.canvas?.getContext('2d');
    if (!ctx) return null;
    return ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
}

export function interpolateStrokePoints(start: Point, end: Point, brushSize: number): Point[] {
    const dist = Math.hypot(end.x - start.x, end.y - start.y);
    const steps = Math.max(Math.ceil(dist / (brushSize / 24)), 1);
    const points: Point[] = [];
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        points.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t
        });
    }
    return points;
}

export function getSelectedDrawLayer() {
    if (!docs.selected) return null;

    const selectedLayerIds = ui.selected?.selectedLayers ?? [];
    if (selectedLayerIds.length !== 1) return null;
    const selectedLayerId = selectedLayerIds[0];

    const layer = docs.selected.layers.find(l => l.id === selectedLayerId);
    if (layer?.type !== 'canvas') return null;
    
    return layer;
}