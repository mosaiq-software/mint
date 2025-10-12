<script lang="ts">
    import type { Color } from "../../scripts/docs.svelte";
    import { Slider } from "melt/builders";

    let { color = $bindable() }: { color: Color } = $props();
    let c = $state(rgbToHsl(color.r, color.g, color.b));

    let slCanvas: HTMLCanvasElement;

    const hSlider = new Slider({
        min: 0,
        max: 1,
        step: 1 / 360,
        orientation: 'horizontal',
        onValueChange: (val) => {
            if (c.h !== val) {
                c = { ...c, h: val };
                updateColor();
            }
        },
    });

    const aSlider = new Slider({
        min: 0,
        max: 1,
        step: 0.01,
        orientation: 'horizontal',
        onValueChange: (val) => {
            if (color.a !== val) {
                color = { ...color, a: val };
            }
        },
    });

    // re-draw the SL square when hue changes
    $effect(() => drawSLSquare(slCanvas, c.h));

    // keep sliders in sync with color prop changes
    $effect(() => {
        if (hSlider.value !== c.h) hSlider.value = c.h;
        if (aSlider.value !== color.a) aSlider.value = color.a;
    });

    /**
     * Draw the saturation-lightness square for a given hue
     * @param canvas HTMLCanvasElement
     * @param hue number (0 to 1)
     */
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

    /**
     * Change the saturation/lightness based on mouse position
     * @param event PointerEvent
     */
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

    function colorToHex(c: Color) {
        const toHex = (n: number) => {
            const hex = Math.round(n).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
    }

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
</script>

<div id="color-picker">
    <div id="sl-container">
        <canvas
            id="sl-selector"
            bind:this={slCanvas}
            width={200}
            height={200}
            onpointermove={handleSLPointer}
            onpointerdown={handleSLPointer}
        ></canvas>
        <div
            id="sl-indicator"
            style:transform={`translate(${c.s * 200 - 6}px, ${(1 - c.l) * 200 - 6}px)`}
        ></div>
    </div>
    <div class="h-slider">
        <div class="h-slider-track" {...hSlider.root}>
            <div class="slider-indicator" {...hSlider.thumb}></div>
        </div>
    </div>
    <div class="a-slider"
        style:background={`linear-gradient(to right, rgba(${color.r}, ${color.g}, ${color.b}, 0) 0%, rgba(${color.r}, ${color.g}, ${color.b}, 1) 100%)`}
        style:border-right={`5px solid rgb(${color.r}, ${color.g}, ${color.b})`}
    >
        <div class="a-slider-track" {...aSlider.root}
        >
            <div class="slider-indicator" {...aSlider.thumb}></div>
        </div>
    </div>
    <div id="codes">
        <div>rgb({Math.round(color.r)}, {Math.round(color.g)}, {Math.round(color.b)})</div>
        <div>hsl({c.h.toFixed(2)}, {c.s.toFixed(2)}, {c.l.toFixed(2)})</div>
        <div>hex: {colorToHex(color)}</div>
        <div>{(color.a * 100).toFixed(0)}%</div>
    </div>
</div>

<style>
    #color-picker {
        display: flex;
        flex-direction: column;
        gap: var(--s-md);
        margin: var(--s-md);
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
        width: 10px;
        height: 10px;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
        pointer-events: none;
    }

    .h-slider {
        position: relative;
        width: 100%;
        height: 10px;
        background: linear-gradient(
            to right,
            #f00 0%,
            #ff0 17%,
            #0f0 33%,
            #0ff 50%,
            #00f 67%,
            #f0f 83%,
            #f00 100%
        );
        border-left: 5px solid #f00;
        border-right: 5px solid #f00;
        border-radius: var(--r-full);
    }

    .h-slider-track {
        position: absolute;
        inset: 0;
    }

    .slider-indicator {
        position: absolute;
        width: 10px;
        height: 10px;
        top: 0;
        background: var(--c-txt);
        border-radius: var(--r-full);
        pointer-events: none;
        margin-left: -5px;
        left: var(--percentage);
    }

    .a-slider {
        position: relative;
        width: 100%;
        height: 10px;
        border-left: 5px solid var(--c-mid);
        border-radius: var(--r-full);
    }

    .a-slider-track {
        position: absolute;
        inset: 0;
    }

    #codes {
        display: flex;
        flex-direction: column;
        gap: var(--s-xs);
        font-family: monospace;
    }

    #codes div {
        font-size: var(--f-sm);
        color: var(--c-sec);
    }
</style>