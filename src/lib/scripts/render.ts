import { type Document } from "./docs.svelte";
import { text } from "./tools";
import { colorToCSS } from "./docs.svelte";

/**
 * Renders the given document onto the provided canvas. Iterates through each
 * layer in the document and draws it onto the canvas, applying visibility,
 * opacity, and transformation settings.
 * @param canvas The HTML canvas element to render onto.
 * @param doc The document to render.
 * @param clear Whether to clear the canvas before rendering. Default is true.
 */
export function render(
    canvas: HTMLCanvasElement,
    doc: Document,
    clear: boolean = true,
) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (clear) ctx.clearRect(0, 0, doc.width, doc.height);

    for (const layer of doc.layers) {
        if (!layer.visible) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity;
        if (layer.type !== "rectangle" && layer.type !== "ellipse")
            ctx.setTransform(layer.transform.matrix);
        else ctx.setTransform(new DOMMatrix());

        if (layer.type === "canvas") {
            // draw the layer's canvas onto the main canvas
            // taking into account the layer's transform
            ctx.drawImage(layer.canvas, 0, 0);
        } else if (layer.type === "text") {
            const element = text.elements[layer.id];
            const lines = getWrappedLines(element);

            // create clipping region
            ctx.beginPath();
            ctx.rect(0, 0, layer.width, layer.height);
            ctx.clip();

            ctx.font = `${layer.bold ? "bold " : ""}${layer.italic ? "italic " : ""}${layer.fontSize}px ${layer.fontFamily}`;
            ctx.fillStyle = colorToCSS(layer.foregroundColor);
            ctx.textBaseline = "top";

            const lineHeight = layer.fontSize * layer.lineHeight;
            lines.forEach((line, index) => {
                ctx.fillText(line, 0, index * lineHeight);
            });
        } else if (layer.type === "rectangle") {
            // draw rectangle on its own layer to prevent outline-fill overlap
            const w = Math.abs(layer.width);
            const h = Math.abs(layer.height);
            const r = Math.min(layer.cornerRadius, w / 2, h / 2);

            const shapeCanvas = new OffscreenCanvas(doc.width, doc.height);
            const shapeCtx = shapeCanvas.getContext("2d");
            if (!shapeCtx) continue;

            shapeCtx.setTransform(layer.transform.matrix);

            shapeCtx.fillStyle = colorToCSS(layer.foregroundColor);
            shapeCtx.beginPath();

            constructRoundedRectPath(shapeCtx, 0, 0, w, h, r);
            shapeCtx.closePath();
            shapeCtx.fill();

            if (layer.strokeWidth > 0) {
                const sw = layer.strokeWidth;
                shapeCtx.fillStyle = colorToCSS(layer.backgroundColor);
                shapeCtx.beginPath();

                if (layer.strokeAlign === "inside") {
                    const ep = 0.5;
                    constructRoundedRectPath(
                        shapeCtx,
                        -ep,
                        -ep,
                        w + ep * 2,
                        h + ep * 2,
                        r,
                    );
                    if (sw < w / 2 && sw < h / 2) {
                        constructRoundedRectPath(
                            shapeCtx,
                            sw,
                            sw,
                            w - 2 * sw,
                            h - 2 * sw,
                            Math.max(0, r - sw),
                        );
                    }
                } else if (layer.strokeAlign === "center") {
                    constructRoundedRectPath(
                        shapeCtx,
                        -sw / 2,
                        -sw / 2,
                        w + sw,
                        h + sw,
                        r + sw / 2,
                    );
                    if (sw < w && sw < h) {
                        constructRoundedRectPath(
                            shapeCtx,
                            sw / 2,
                            sw / 2,
                            w - sw,
                            h - sw,
                            Math.max(0, r - sw / 2),
                        );
                    }
                } else if (layer.strokeAlign === "outside") {
                    constructRoundedRectPath(
                        shapeCtx,
                        -sw,
                        -sw,
                        w + 2 * sw,
                        h + 2 * sw,
                        r + sw,
                    );
                    constructRoundedRectPath(shapeCtx, 0, 0, w, h, r);
                }

                shapeCtx.closePath();
                shapeCtx.fill("evenodd");

                ctx.drawImage(shapeCanvas, 0, 0);
            }
        } else if (layer.type === "ellipse") {
            // draw ellipse on its own layer to prevent outline-fill overlap
            const w = Math.abs(layer.width);
            const h = Math.abs(layer.height);

            const shapeCanvas = new OffscreenCanvas(doc.width, doc.height);
            const shapeCtx = shapeCanvas.getContext("2d");
            if (!shapeCtx) continue;

            shapeCtx.setTransform(layer.transform.matrix);

            shapeCtx.fillStyle = colorToCSS(layer.foregroundColor);
            shapeCtx.beginPath();
            shapeCtx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
            shapeCtx.closePath();
            shapeCtx.fill();

            if (layer.strokeWidth > 0) {
                const sw = layer.strokeWidth;
                shapeCtx.fillStyle = colorToCSS(layer.backgroundColor);
                shapeCtx.beginPath();

                if (layer.strokeAlign === "inside") {
                    const ep = 0.5;
                    shapeCtx.ellipse(
                        w / 2,
                        h / 2,
                        w / 2 + ep,
                        h / 2 + ep,
                        0,
                        0,
                        Math.PI * 2,
                    );
                    if (sw < w / 2 && sw < h / 2) {
                        shapeCtx.ellipse(
                            w / 2,
                            h / 2,
                            w / 2 - sw,
                            h / 2 - sw,
                            0,
                            0,
                            Math.PI * 2,
                        );
                    }
                } else if (layer.strokeAlign === "center") {
                    shapeCtx.ellipse(
                        w / 2,
                        h / 2,
                        w / 2 + sw / 2,
                        h / 2 + sw / 2,
                        0,
                        0,
                        Math.PI * 2,
                    );
                    if (sw < w && sw < h) {
                        shapeCtx.ellipse(
                            w / 2,
                            h / 2,
                            w / 2 - sw / 2,
                            h / 2 - sw / 2,
                            0,
                            0,
                            Math.PI * 2,
                        );
                    }
                } else if (layer.strokeAlign === "outside") {
                    shapeCtx.ellipse(
                        w / 2,
                        h / 2,
                        w / 2 + sw,
                        h / 2 + sw,
                        0,
                        0,
                        Math.PI * 2,
                    );
                    shapeCtx.ellipse(
                        w / 2,
                        h / 2,
                        w / 2,
                        h / 2,
                        0,
                        0,
                        Math.PI * 2,
                    );
                }

                shapeCtx.closePath();
                shapeCtx.fill("evenodd");

                ctx.drawImage(shapeCanvas, 0, 0);
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

    const text = node.textContent || "";
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
            // new line detected
            lines.push(text.slice(start, i - 1));
            start = i - 1;
            lastTop = top;
        }
    }

    // push remaining text
    if (start < text.length) {
        lines.push(text.slice(start));
    }
    return lines;
}

/**
 * Constructs a rounded rectangle path on the given canvas context.
 * Restricts the corner radius to not exceed half the width or height.
 * @param ctx The canvas rendering context.
 * @param x The x coordinate of the rectangle's top-left corner.
 * @param y The y coordinate of the rectangle's top-left corner.
 * @param width The width of the rectangle.
 * @param height The height of the rectangle.
 * @param radius The corner radius.
 */
function constructRoundedRectPath(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) {
    const r = Math.min(radius, Math.abs(width / 2), Math.abs(height / 2));

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
