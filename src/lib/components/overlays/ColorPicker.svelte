<script module>
    let previouslyPickedColors: Color[] = $state([]);
</script>

<script lang="ts">
    import type { Color } from "../../scripts/docs.svelte";
    import { Slider } from "../ui";

    let { color = $bindable() }: { color: Color } = $props();
    let c = $state(rgbToHsl(color.r, color.g, color.b));

    let slCanvas: HTMLCanvasElement;

    // https://gist.github.com/mjackson/5311256
    function hue2rgb(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    function hslToRgb(h: number, s: number, l: number) {
        let r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    function rgbToHsl(r: number, g: number, b: number) {
        r /= 255, g /= 255, b /= 255;

        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h: number, s: number, l: number;
        h = s = l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h, s, l}
    }

    function drawSLSquare(canvas: HTMLCanvasElement, hue: number) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const img = ctx.createImageData(width, height);
        const data = img.data;

        for (let y = 0; y < height; y++) {
            const l = 1 - y / height;
            for (let x = 0; x < width; x++) {
            const s = x / width;
            const {r, g, b} = hslToRgb(hue, s, l);
            const i = (y * width + x) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
            }
        }

        ctx.putImageData(img, 0, 0);
    }

    function handleSLPointer(event: PointerEvent) {
        if (event.buttons !== 1) return; // Only respond to primary button

        if (!slCanvas) return;
        const rect = slCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const s = Math.min(Math.max(x / rect.width, 0), 1);
        const l = Math.min(Math.max(1 - y / rect.height, 0), 1);

        c = { ...c, s, l };
        updateColor();
    }

    function updateColor() {
        const rgb = hslToRgb(c.h, c.s, c.l);
        color = { r: rgb.r, g: rgb.g, b: rgb.b, a: color.a };
    }

    $effect(() => drawSLSquare(slCanvas, c.h));
</script>

<div id="color-picker">
    <div id="sl-container">
        <canvas
            id="sl-selector"
            bind:this={slCanvas}
            width={200}
            height={200}
            onpointermove={handleSLPointer}
        ></canvas>
        <div
            id="sl-indicator"
            style:transform={`translate(${c.s * 200 - 6}px, ${(1 - c.l) * 200 - 6}px)`}
        ></div>
    </div>
    <Slider min={0} max={1} step={1/360} bind:value={c.h} onValueChange={updateColor} />
    <Slider min={0} max={1} step={0.01} bind:value={color.a} />
</div>

<style>
    #color-picker {
        display: flex;
        flex-direction: column;
        gap: var(--s-md);
    }

    #sl-container {
        position: relative;
        width: 200px;
        height: 200px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        touch-action: none;
    }

    #sl-indicator {
        position: absolute;
        top: 0;
        left: 0;
        width: 12px;
        height: 12px;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        pointer-events: none;
    }
</style>