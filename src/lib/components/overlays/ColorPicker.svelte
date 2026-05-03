<script lang="ts">
    import { postAction } from "../../scripts/action";
    import type { Color } from "../../scripts/docs.svelte";
    import { Slider } from "melt/builders";
    import ui from "../../scripts/ui.svelte";
    import { Pipette } from "@lucide/svelte";
    import "eyedropper-polyfill";
    import Input from "../ui/Input.svelte";

    let { color = $bindable() }: { color: Color } = $props();
    let hue: number = $state(0);
    let rgbInputs = $state({ r: 0, g: 0, b: 0 });
    let hslInputs = $state({ h: 0, s: 0, l: 0 });
    let hexInput = $state("#000000");
    let alphaInput = $state(100);

    /** Derive saturation and lightness from color */
    let sl = $derived.by(() => {
        const newC = rgbToHsl(color.r, color.g, color.b);
        return { s: newC.s, l: newC.l };
    });

    /**
     * When the color changes externally, update hue and alpha slider positions.
     * Prevent updating hue if saturation is near zero (to avoid hue jumps).
     */
    $effect(() => {
        rgbInputs = {
            r: Math.round(color.r),
            g: Math.round(color.g),
            b: Math.round(color.b),
        };

        const hsl = rgbToHsl(color.r, color.g, color.b);
        hslInputs = {
            h: Number(hsl.h.toFixed(2)),
            s: Number(hsl.s.toFixed(2)),
            l: Number(hsl.l.toFixed(2)),
        };

        hexInput = colorToHex(color);
        alphaInput = Math.round(color.a * 100);
    });

    /** Update color based on current hue, saturation, and lightness */
    function updateColor() {
        color = { ...hslToRgb(hue, sl.s, sl.l), a: color.a };
    }

    /** Redraw saturation-lightness square when hue changes */
    let slCanvas: HTMLCanvasElement;
    $effect(drawSLSquare);

    /** Hue slider */
    const hSlider = new Slider({
        min: 0,
        max: 0.999,
        step: 1 / 360,
        orientation: "horizontal",
        onValueChange: (val) => {
            if (Math.abs(hue - val) > 0.001 && Math.abs(hue - val) < 0.999) {
                hue = val;
                updateColor();
            }
        },
    });

    /** Alpha slider */
    const aSlider = new Slider({
        value: 1,
        min: 0,
        max: 1,
        step: 0.01,
        orientation: "horizontal",
        onValueChange: (val) => {
            if (Math.abs(color.a - val) > 0.001) {
                color = { ...color, a: val };
            }
        },
    });

    /**
     * Draw the saturation-lightness square for a given hue
     * @param canvas HTMLCanvasElement
     */
    function drawSLSquare() {
        if (!slCanvas) return;

        const ctx = slCanvas.getContext("2d");
        if (!ctx) return;

        const { width, height } = slCanvas;
        const img = ctx.createImageData(width, height);
        const data = img.data;

        for (let y = 0; y < height; y++) {
            const l = 1 - y / height;
            for (let x = 0; x < width; x++) {
                const s = x / width;
                const { r, g, b } = hslToRgb(hue, s, l);
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

        sl = {
            s: Math.min(Math.max(x / rect.width, 0), 1),
            l: Math.min(Math.max(1 - y / rect.height, 0), 1),
        };
        updateColor();
    }

    /**
     * Add an undo/redo action to the currently selected layer.
     * Does not apply an action if multiple layers are selected,
     * or if the selected layer is a canvas.
     */
    function applyColor() {
        if (ui.selectedLayers.length === 1) {
            const layer = ui.selectedLayers[0];
            if (layer.type === "canvas") return;
            postAction({
                type: "update",
                layerID: layer.id,
                newLayer: {
                    foregroundColor: layer.foregroundColor,
                    backgroundColor: layer.backgroundColor,
                },
            });
        }
    }

    function clamp(n: number, min: number, max: number) {
        return Math.min(Math.max(n, min), max);
    }

    function updateFromRgb() {
        color = {
            r: clamp(rgbInputs.r, 0, 255),
            g: clamp(rgbInputs.g, 0, 255),
            b: clamp(rgbInputs.b, 0, 255),
            a: color.a,
        };
    }

    function updateFromHsl() {
        hue = clamp(hslInputs.h, 0, 1);

        const rgb = hslToRgb(hue, hslInputs.s, hslInputs.l);
        color = { ...rgb, a: color.a };
    }

    function updateFromHex() {
        const match = /^#?([0-9a-fA-F]{6})$/.exec(hexInput);
        if (!match) return;

        const intVal = parseInt(match[1], 16);

        color = {
            r: (intVal >> 16) & 255,
            g: (intVal >> 8) & 255,
            b: intVal & 255,
            a: color.a,
        };
    }

    function updateAlpha() {
        color = {
            ...color,
            a: clamp(alphaInput / 100, 0, 1),
        };
    }

    /**
     * Convert Color to hex string
     * @param c Color
     */
    function colorToHex(c: Color) {
        const toHex = (n: number) => {
            const hex = Math.round(n).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        };
        return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
    }

    /**
     * Helper function for HSL to RGB conversion
     * https://gist.github.com/mjackson/5311256
     * @param p Parameter p ("minumum" RGB component value)
     * @param q Parameter q ("maximum" RGB component value)
     * @param t Parameter t (adjusted hue)
     */
    function hue2rgb(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

    /**
     * Convert HSL to RGB
     * @param h Hue
     * @param s Saturation
     * @param l Lightness
     */
    function hslToRgb(h: number, s: number, l: number) {
        let r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    /**
     * Convert RGB to HSL
     * @param r Red component (0-255)
     * @param g Green component (0-255)
     * @param b Blue component (0-255)
     */
    function rgbToHsl(r: number, g: number, b: number) {
        ((r /= 255), (g /= 255), (b /= 255));

        let max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        let h: number, s: number, l: number;
        h = s = l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return { h, s, l };
    }

    let pointerUpHandler: ((e: PointerEvent) => void) | null = null;

    /**
     * Handle focus on the slider thumb to track pointer up events.
     * @param id ID of the slider thumb element
     */
    function handleFocus(id: string) {
        pointerUpHandler = (e) => {
            document.getElementById(id)?.blur();
        };
        document.addEventListener("pointerup", pointerUpHandler);
    }

    /** Handle blur on the slider thumb to clean up event listeners. */
    function handleBlur() {
        if (pointerUpHandler) {
            document.removeEventListener("pointerup", pointerUpHandler);
            pointerUpHandler = null;
        }

        applyColor();
    }

    async function pickColorFromScreen() {
        if (!("EyeDropper" in window)) {
            alert("The eye dropper is not supported in this browser.");
            return;
        }

        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();

        // result.sRGBHex → "#RRGGBB"
        const hex = result.sRGBHex;

        const intVal = parseInt(hex.slice(1), 16);

        color = {
            r: (intVal >> 16) & 255,
            g: (intVal >> 8) & 255,
            b: intVal & 255,
            a: color.a, // preserve alpha
        };
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
            onpointerup={applyColor}
            onpointerleave={(e) => {
                if (e.buttons === 1) applyColor();
            }}
        ></canvas>
        <div
            id="sl-indicator"
            style:transform={`translate(${sl.s * 200 - 6}px, ${(1 - sl.l) * 200 - 6}px)`}
        ></div>
    </div>
    <div class="h-slider">
        <div class="h-slider-track" {...hSlider.root}>
            <div
                class="slider-indicator"
                {...hSlider.thumb}
                onblur={handleBlur}
                onfocus={() => handleFocus(hSlider.thumb.id)}
            ></div>
        </div>
    </div>
    <div
        class="a-slider"
        style:background={`linear-gradient(to right, rgba(${color.r}, ${color.g}, ${color.b}, 0) 0%, rgba(${color.r}, ${color.g}, ${color.b}, 1) 100%)`}
        style:border-right={`5px solid rgb(${color.r}, ${color.g}, ${color.b})`}
    >
        <div class="a-slider-track" {...aSlider.root}>
            <div
                class="slider-indicator"
                {...aSlider.thumb}
                onblur={handleBlur}
                onfocus={() => handleFocus(aSlider.thumb.id)}
            ></div>
        </div>
    </div>
    <div id="codes">
        <div id="codes">
            <div class="code">
                <Input
                    type="number"
                    min="0"
                    max="255"
                    bind:value={rgbInputs.r}
                    oninput={updateFromRgb}
                    variant="underline"
                    labelPosition="side"
                    style="width: 2rem"
                    name="r"
                >
                    r:
                </Input>
                <Input
                    type="number"
                    min="0"
                    max="255"
                    bind:value={rgbInputs.g}
                    oninput={updateFromRgb}
                    variant="underline"
                    labelPosition="side"
                    style="width: 2rem"
                    name="g"
                >
                    g:
                </Input>
                <Input
                    type="number"
                    min="0"
                    max="255"
                    bind:value={rgbInputs.b}
                    oninput={updateFromRgb}
                    variant="underline"
                    labelPosition="side"
                    style="width: 2rem"
                    name="b"
                >
                    b:
                </Input>
            </div>

            <div class="code">
                <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    bind:value={hslInputs.h}
                    oninput={updateFromHsl}
                    variant="underline"
                    labelPosition="side"
                    style="width: 2rem"
                    name="h"
                >
                    h:
                </Input>
                <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    bind:value={hslInputs.s}
                    oninput={updateFromHsl}
                    variant="underline"
                    labelPosition="side"
                    style="width: 2rem"
                    name="s"
                >
                    s:
                </Input>
                <Input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    bind:value={hslInputs.l}
                    oninput={updateFromHsl}
                    variant="underline"
                    labelPosition="side"
                    style="width: 2rem"
                    name="l"
                >
                    l:
                </Input>
            </div>

            <Input
                type="text"
                bind:value={hexInput}
                oninput={updateFromHex}
                variant="underline"
                labelPosition="side"
                style="width: 4rem"
                name="hex"
            >
                hex:
            </Input>

            <div id="alpha-input">
                <Input
                    type="number"
                    min="0"
                    max="100"
                    bind:value={alphaInput}
                    oninput={updateAlpha}
                    variant="underline"
                    labelPosition="side"
                    style="width: 2rem"
                    name="alpha"
                >
                    alpha:
                </Input>%
            </div>
        </div>
    </div>

    <button id="eyedropper" onclick={pickColorFromScreen}>
        <Pipette></Pipette>
    </button>
</div>

<style>
    #eyedropper {
        border-radius: var(--r-md);
        margin-right: 0;
        aspect-ratio: 1;
        width: fit-content;
    }
    #color-picker {
        display: flex;
        flex-direction: column;
        gap: var(--s-md);
        margin: var(--s-md);
    }

    .code {
        display: flex;
        gap: var(--s-sm);
        align-items: center;
        justify-content: flex-start;
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
        border-left: 5px solid var(--c-pop);
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

    #alpha-input {
        display: flex;
        gap: var(--s-xs);
        align-items: center;
    }
</style>
