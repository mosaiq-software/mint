import docs, { type Document } from './docs.svelte';
import { text } from './tools';
import { colorToCSS } from './docs.svelte';

export function render(canvas: HTMLCanvasElement, doc: Document, clear: boolean = true) {

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (clear)
        ctx.clearRect(0, 0, doc.width, doc.height);

    for (const layer of doc.layers) {
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
                ctx.fillText(line, 0, index * lineHeight);
            });
        } else if (layer.type === 'rectangle') {
            // draw rectangle
            const w = layer.width;
            const h = layer.height;
            const r = Math.min(layer.cornerRadius, w / 2, h / 2);

            ctx.fillStyle = colorToCSS(layer.foregroundColor);
            ctx.beginPath();
            
            constructRoundedRectPath(ctx, 0, 0, w, h, r);
            ctx.closePath();
            ctx.fill();

            if (layer.strokeWidth > 0) {
                const sw = layer.strokeWidth;
                ctx.fillStyle = colorToCSS(layer.backgroundColor);
                ctx.beginPath();

                if (layer.strokeAlign === 'inside') {
                    const ep = 0.5;
                    constructRoundedRectPath(ctx, -ep, -ep, w + ep * 2, h + ep * 2, r);
                    if (sw < w / 2 && sw < h / 2) {
                        constructRoundedRectPath(ctx, sw, sw, w - 2 * sw, h - 2 * sw, Math.max(0, r - sw));
                    }
                } else if (layer.strokeAlign === 'center') {
                    constructRoundedRectPath(ctx, -sw / 2, -sw / 2, w + sw, h + sw, r + sw / 2);
                    if (sw < w && sw < h) {
                        constructRoundedRectPath(ctx, sw / 2, sw / 2, w - sw, h - sw, Math.max(0, r - sw / 2));
                    }
                } else if (layer.strokeAlign === 'outside') {
                    constructRoundedRectPath(ctx, -sw, -sw, w + 2 * sw, h + 2 * sw, r + sw);
                    constructRoundedRectPath(ctx, 0, 0, w, h, r);
                }

                ctx.closePath();
                ctx.fill('evenodd');
            }
        } else if (layer.type === 'ellipse') {
            // draw ellipse
            const w = layer.width;
            const h = layer.height;

            ctx.fillStyle = colorToCSS(layer.foregroundColor);
            ctx.beginPath();
            ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();

            if (layer.strokeWidth > 0) {
                const sw = layer.strokeWidth;
                ctx.fillStyle = colorToCSS(layer.backgroundColor);
                ctx.beginPath();

                if (layer.strokeAlign === 'inside') {
                    const ep = 0.5;
                    ctx.ellipse(w / 2, h / 2, w / 2 + ep, h / 2 + ep, 0, 0, Math.PI * 2);
                    if (sw < w / 2 && sw < h / 2) {
                        ctx.ellipse(w / 2, h / 2, w / 2 - sw, h / 2 - sw, 0, 0, Math.PI * 2);
                    }
                } else if (layer.strokeAlign === 'center') {
                    ctx.ellipse(w / 2, h / 2, w / 2 + sw / 2, h / 2 + sw / 2, 0, 0, Math.PI * 2);
                    if (sw < w && sw < h) {
                        ctx.ellipse(w / 2, h / 2, w / 2 - sw / 2, h / 2 - sw / 2, 0, 0, Math.PI * 2);
                    }
                } else if (layer.strokeAlign === 'outside') {
                    ctx.ellipse(w / 2, h / 2, w / 2 + sw, h / 2 + sw, 0, 0, Math.PI * 2);
                    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
                }

                ctx.closePath();
                ctx.fill('evenodd');
            }
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

function constructRoundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
}