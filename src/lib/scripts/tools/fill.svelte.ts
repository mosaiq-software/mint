import type { Tool, Point } from "./index";
import ui from "../ui.svelte";
import docs, { type Color } from "../docs.svelte";
import type {CanvasLayer} from "../layer";
import {postAction} from "../action";

export const fillTool: Tool = {
    name: 'fill',
    onPointerDown: (data) => {
        // if a layer is selected, ensure it's a canvas layer
        if (!ui.selectedDocument || !data.l) return;
        const selectedLayers = ui.selected?.selectedLayers ?? [];
        if (selectedLayers.length === 0) return;

        if (!docs.selected) return;

        const layer = docs.selected.layers.find(l => l.id === selectedLayers[0]);
        if (!layer || layer.type !== 'canvas') return;

        const l: Point = {x: Math.floor(data.l.x), y: Math.floor(data.l.y)};

        const ctx = layer.canvas.getContext('2d');
        if (!ctx) return;
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
        const dstColor = {...layer.foregroundColor, a: layer.foregroundColor.a * 255};

        function areColorsEqual(a: Color, b: Color) {
            return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
        }

        if (areColorsEqual(srcColor, dstColor)) return;

        const imageData = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);

        function getPointColor(p: Point): Color {
            const pointIndex = p.y * (layer as CanvasLayer).canvas.width + p.x;
            return {
                r: imageData.data[pointIndex * 4],
                g: imageData.data[pointIndex * 4 + 1],
                b: imageData.data[pointIndex * 4 + 2],
                a: imageData.data[pointIndex * 4 + 3],
            }
        }

        function getNeighborPoints(p: Point): Point[] {
            const neighbors: Point[] = [];
            if (p.x > 0) {
                const n = {x: p.x - 1, y: p.y};
                if (areColorsEqual(srcColor, getPointColor(n))) neighbors.push(n);
            }
            if (p.y > 0) {
                const n = {x: p.x, y: p.y - 1};
                if (areColorsEqual(srcColor, getPointColor(n))) neighbors.push(n);
            }
            if (p.x < (layer as CanvasLayer).canvas.width) {
                const n = {x: p.x + 1, y: p.y};
                if (areColorsEqual(srcColor, getPointColor(n))) neighbors.push(n);
            }
            if (p.y < (layer as CanvasLayer).canvas.height) {
                const n = {x: p.x, y: p.y + 1};
                if (areColorsEqual(srcColor, getPointColor(n))) neighbors.push(n);
            }
            return neighbors;
        }

        const queue: Point[] = [l];
        const visited: Set<Point> = new Set();

        const start = Date.now();
        while (queue.length > 0) {
            const p = queue.shift();
            if (!p || !areColorsEqual(srcColor, getPointColor(p))) continue;
            // visited.add(p);

            const pointIndex = p.y * (layer as CanvasLayer).canvas.width + p.x;

            imageData.data[pointIndex * 4] = dstColor.r;
            imageData.data[pointIndex * 4 + 1] = dstColor.g;
            imageData.data[pointIndex * 4 + 2] = dstColor.b;
            imageData.data[pointIndex * 4 + 3] = dstColor.a;

            queue.push(...getNeighborPoints(p));
        }
        console.log(Date.now() - start, 'ms');

        ctx.putImageData(imageData, 0, 0);

        postAction({
            type: "content",
            layerID: layer.id,
            newContent: ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
        });
        docs.selected.layers = [...docs.selected.layers];
    }
}