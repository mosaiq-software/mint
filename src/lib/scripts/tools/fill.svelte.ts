import type { Tool, Point } from "./index";
import ui from "../ui.svelte";
import docs, { type Color } from "../docs.svelte";
import { postAction } from "../action";

/**
 * Fill tool implementation using span filling algorithm. Fills all
 * contiguous pixels of the same color as the clicked pixel with
 * the current foreground color of the selected canvas layer.
 */
export const fillTool: Tool = {
    name: 'fill',
    onPointerDown: (data) => {
        if (!ui.selectedDocument || !data.l || !docs.selected) return;
        if (ui.selectedLayers.length !== 1 || ui.selectedLayers[0].type !== 'canvas') return;
        const layer = ui.selectedLayers[0];

        const l: Point = {x: Math.floor(data.l.x), y: Math.floor(data.l.y)};

        const ctx = layer.canvas.getContext('2d');
        if (!ctx) return;
        const width = layer.canvas.width, height = layer.canvas.height;
        const srcColorData = ctx.getImageData(l.x, l.y, 1, 1).data;

        function imageDataToColor(data: ImageDataArray): Color {
            return {
                r: data[0],
                g: data[1],
                b: data[2],
                a: data[3]
            };
        }

        const srcColor = imageDataToColor(srcColorData);
        const unroundedDstColor = {...layer.foregroundColor, a: layer.foregroundColor.a * 255};
        const dstColor: Color = {
            r: Math.round(unroundedDstColor.r),
            g: Math.round(unroundedDstColor.g),
            b: Math.round(unroundedDstColor.b),
            a: Math.round(unroundedDstColor.a)
        }

        function areColorsEqual(a: Color, b: Color) {
            return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
        }

        if (areColorsEqual(srcColor, dstColor)) return;

        const imageData = ctx.getImageData(0, 0, width, height);

        function getPointColor(p: Point): Color {
            const pointIndex = p.y * width + p.x;
            return {
                r: imageData.data[pointIndex * 4],
                g: imageData.data[pointIndex * 4 + 1],
                b: imageData.data[pointIndex * 4 + 2],
                a: imageData.data[pointIndex * 4 + 3],
            }
        }

        function isFillable(p: Point) {
            const isSrcColor = areColorsEqual(srcColor, getPointColor(p));
            const inX = 0 <= p.x && p.x < width;
            const inY = 0 <= p.y && p.y < height;
            return isSrcColor && inX && inY;
        }

        function fillPoint(p: Point) {
            const pointIndex = p.y * width + p.x;

            imageData.data[pointIndex * 4] = dstColor.r;
            imageData.data[pointIndex * 4 + 1] = dstColor.g;
            imageData.data[pointIndex * 4 + 2] = dstColor.b;
            imageData.data[pointIndex * 4 + 3] = dstColor.a;
        }

        // span filling algorithm. just trust me OK?
        // https://en.wikipedia.org/wiki/Flood_fill#Span_filling

        interface QueueEntry {x1: number, x2: number, y: number, dy: number}
        const queue: QueueEntry[] = [
            {x1: l.x, x2: l.x, y: l.y, dy: 1},
            {x1: l.x, x2: l.x, y: l.y - 1, dy: -1}
        ];

        while (queue.length > 0) {
            const entry = queue.shift();
            if (!entry) continue;
            let {x1, x2, y, dy} = entry;
            let x = x1;
            if (isFillable({x, y})) {
                while (isFillable({x: x - 1, y})) {
                    fillPoint({x: x - 1, y});
                    x -= 1;
                }
                if (x < x1) {
                    queue.push({x1: x, x2: x1 - 1, y: y - dy, dy: -1 * dy});
                }
            }
            while (x1 <= x2) {
                while (isFillable({x: x1, y})) {
                    fillPoint({x: x1, y});
                    x1 = x1 + 1;
                }
                if (x1 > x) {
                    queue.push({x1: x, x2: x1 - 1, y: y + dy, dy});
                }
                if (x1 - 1 > x2) {
                    queue.push({x1: x2 + 1, x2: x1 - 1, y: y - dy, dy: -1 * dy});
                }
                x1 = x1 + 1;
                while (x1 < x2 && !isFillable({x: x1, y})) {
                    x1++;
                }
                x = x1;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        postAction({
            type: "content",
            layerID: layer.id,
            newContent: ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
        });
        docs.selected.layers = [...docs.selected.layers];
    }
}