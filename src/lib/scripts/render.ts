import { getSelectedDoc } from './docs.svelte';

export function render(canvas: HTMLCanvasElement) {
    const doc = getSelectedDoc();
    if (!doc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, doc.width, doc.height);

    for (const layer of doc.layers) {
        if (!layer.visible) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        
        if (layer.type === 'canvas') {
            ctx.drawImage(layer.canvas, 0, 0);
        }
        
        ctx.restore();
    }
}