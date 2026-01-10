<script lang="ts">
    import Panel from "./Panel.svelte";
    import { Input, IconButtonVisual } from "../ui";
    import ui, {
        setPreviousRotation,
        getBoundsCenter,
    } from "../../scripts/ui.svelte";
    import { postAction, type PostAction } from "../../scripts/action";
    import { FlipVertical2, FlipHorizontal2 } from "@lucide/svelte";
    import {
        translateLayers,
        scaleLayers,
        rotateLayers,
    } from "../../scripts/tools/select.svelte";
    import SliderWithInput from "../ui/SliderWithInput.svelte";

    const bounds = $derived(ui.selected ? ui.selected.bounds : null);

    // Transform values bound to the input fields
    let x = $derived(bounds ? bounds.pos.x.toFixed(2) : "");
    let y = $derived(bounds ? bounds.pos.y.toFixed(2) : "");

    let w = $derived(bounds ? bounds.size.x.toFixed(2) : "");
    let h = $derived(bounds ? bounds.size.y.toFixed(2) : "");

    let r = $derived(bounds ? bounds.rot : 0);
    let rs = $derived(bounds ? bounds.rot.toFixed(1) : "0"); // string version for input field

    /**
     * Safely parse a float from a string, returning a fallback
     * value if parsing fails.
     * @param val The string to parse.
     * @param fallback The fallback value if parsing fails.
     */
    function safeParseFloat(val: string, fallback: number) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
    }

    /**
     * Translate, rotate, or scale the selected layers based on
     * modified input values.
     * @param triggerPostAction Whether to trigger a new undo/redo action.
     */
    function applyTransform(triggerPostAction: boolean) {
        if (!bounds) return;

        const xs = safeParseFloat(x, bounds.pos.x);
        const ys = safeParseFloat(y, bounds.pos.y);
        const ws = safeParseFloat(w, bounds.size.x);
        const hs = safeParseFloat(h, bounds.size.y);

        const actions: PostAction[] = [];

        if (xs !== bounds.pos.x || ys !== bounds.pos.y) {
            const dx = xs - bounds.pos.x;
            const dy = ys - bounds.pos.y;
            translateLayers(ui.selectedLayers, dx, dy, "current");

            for (const layer of ui.selectedLayers) {
                actions.push({
                    type: "transform",
                    layerID: layer.id,
                    newMatrix: layer.transform.matrix,
                    newBounds: ui.selected ? ui.selected.bounds : null,
                });
            }
        }

        if (ws !== bounds.size.x || hs !== bounds.size.y) {
            const scaleX = ws / bounds.size.x;
            const scaleY = hs / bounds.size.y;
            let center = { x: bounds.pos.x, y: bounds.pos.y };
            scaleLayers(
                ui.selectedLayers,
                scaleX,
                scaleY,
                center,
                r,
                "current",
            );

            for (const layer of ui.selectedLayers) {
                actions.push({
                    type: "transform",
                    layerID: layer.id,
                    newMatrix: layer.transform.matrix,
                    newBounds: ui.selected ? ui.selected.bounds : null,
                });
                if (layer.type === "rectangle" || layer.type === "ellipse") {
                    actions.push({
                        type: "update",
                        layerID: layer.id,
                        newLayer: {
                            width: layer.width,
                            height: layer.height,
                        },
                    });
                }
            }
        }

        if (r !== bounds.rot) {
            let center = { x: bounds.pos.x, y: bounds.pos.y };
            const deltaAngle = r - bounds.rot;
            rotateLayers(ui.selectedLayers, deltaAngle, center, "current");
            setPreviousRotation(r);

            for (const layer of ui.selectedLayers) {
                actions.push({
                    type: "transform",
                    layerID: layer.id,
                    newMatrix: layer.transform.matrix,
                    newBounds: ui.selected ? ui.selected.bounds : null,
                });
            }
        }

        if (triggerPostAction && actions.length > 0) {
            postAction({
                type: "compound",
                actions: actions,
            });
        }
    }

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

    /** Debounced application of transform changes, used for rotation. */
    function debouncedApplyTransform() {
        if (debounceTimeout) return;
        if (r == bounds?.rot) return;

        debounceTimeout = setTimeout(() => {
            applyTransform(false);
            debounceTimeout = null;
        }, 8); // ~1 frame at 60Hz
    }

    /** Flip the selected layers horizontally or vertically. */
    function flip(direction: "h" | "v") {
        if (ui.selected?.bounds) {
            const center = getBoundsCenter(ui.selected.bounds);
            scaleLayers(
                ui.selectedLayers,
                direction === "h" ? -1 : 1,
                direction === "v" ? -1 : 1,
                center,
                r,
                "current",
            );
        }

        const actions: PostAction[] = [];
        for (const layer of ui.selectedLayers) {
            actions.push({
                type: "transform",
                layerID: layer.id,
                newMatrix: layer.transform.matrix,
                newBounds: ui.selected ? ui.selected.bounds : null,
            });
        }

        postAction({
            type: "compound",
            actions: actions,
        });
    }
</script>

<Panel title="Transform" disabled={!bounds}>
    <div>
        <Input
            name="x"
            labelPosition="side"
            disabled={!bounds}
            bind:value={x}
            onBlur={() => applyTransform(true)}
        >
            <div class="label">X:</div>
        </Input>
        <Input
            name="y"
            labelPosition="side"
            disabled={!bounds}
            bind:value={y}
            onBlur={() => applyTransform(true)}
        >
            <div class="label">Y:</div>
        </Input>
    </div>
    <div>
        <Input
            name="w"
            labelPosition="side"
            disabled={!bounds}
            bind:value={w}
            onBlur={() => applyTransform(true)}
        >
            <div class="label">W:</div>
        </Input>
        <Input
            name="h"
            labelPosition="side"
            disabled={!bounds}
            bind:value={h}
            onBlur={() => applyTransform(true)}
        >
            <div class="label">H:</div>
        </Input>
    </div>
    <div>
        <SliderWithInput
            name="Rotation"
            bind:value={r}
            min={-180}
            max={180}
            step={1}
            onInputBlur={() => {
                if (!bounds) return;
                applyTransform(true);
            }}
            onSliderChange={debouncedApplyTransform}
            onSliderBlur={() => applyTransform(true)}
        />
        <button onclick={() => flip("h")}>
            <IconButtonVisual label="Flip horizontally">
                <FlipHorizontal2 size={16} />
            </IconButtonVisual>
        </button>
        <button onclick={() => flip("v")}>
            <IconButtonVisual label="Flip vertically">
                <FlipVertical2 size={16} />
            </IconButtonVisual>
        </button>
    </div>
</Panel>

<style>
    .label {
        width: 2ch;
    }

    div {
        display: flex;
        gap: var(--s-md);
        align-items: center;
        flex: 1;
    }
</style>
