import docs from './docs.svelte';
import { text } from './tools';
import { colorToCSS } from './docs.svelte';

export function render(canvas: HTMLCanvasElement) {
    if (!docs.selected) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, docs.selected.width, docs.selected.height);

    for (const layer of docs.selected.layers) {
        if (!layer.visible) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.setTransform(layer.transform.matrix);
        
        if (layer.type === 'canvas') {
            // draw the layer's canvas onto the main canvas
            // taking into account the layer's transform
            ctx.drawImage(layer.canvas, 0, 0);
        } else if (layer.type === 'text') {
            const element = text.elements[layer.id];
            const lines = getWrappedLines(element);

            // create clipping region
            ctx.beginPath();
            ctx.rect(0, 0, layer.width, layer.height);
            ctx.clip();
            
            ctx.font = `${layer.bold ? 'bold ' : ''}${layer.italic ? 'italic ' : ''}${layer.fontSize}px ${layer.fontFamily}`;
            ctx.fillStyle = colorToCSS(layer.foregroundColor);
            ctx.textBaseline = 'top';

            const lineHeight = layer.fontSize * layer.lineHeight;
            lines.forEach((line, index) => {
                ctx.fillText(line, 0, index * lineHeight, layer.width);
            });
        }
        
        ctx.restore();
    }
}

/**
 * Given an HTML element containing text, returns an array of strings,
 * each representing a line of text as rendered in the element.
 * This function uses the DOM to measure where lines break.
 * @param element 
 * @returns A list of strings, each representing a line of text
 */
function getWrappedLines(element: HTMLElement): string[] {
    const lines: string[] = [];
    const node = element.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return lines;

    const text = node.textContent || '';
    if (!text) return lines;

    let start = 0;
    let lastTop: number | null = null;
    let range = document.createRange();

    for (let i = 1; i <= text.length; i++) {
        range.setStart(node, start);
        range.setEnd(node, i);
        const rects = range.getClientRects();
        if (rects.length === 0) continue;
        const top = rects[rects.length - 1].top;

        if (lastTop === null) {
            lastTop = top;
        } else if (top !== lastTop) {
            // New line detected
            lines.push(text.slice(start, i - 1));
            start = i - 1;
            lastTop = top;
        }
    }
    // Push the last line
    if (start < text.length) {
        lines.push(text.slice(start));
    }
    return lines;
}