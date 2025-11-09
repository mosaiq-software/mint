<script lang="ts">
    import Panel from "./Panel.svelte";
    import {Slider, Input, Checkbox, IconButtonVisual} from "../ui";
    import ui, { setPreviousRotation } from "../../scripts/ui.svelte";
    import { postAction, type PostAction } from "../../scripts/action";
    import { FlipVertical2, FlipHorizontal2 } from '@lucide/svelte';
    import { translateLayers, scaleLayers, rotateLayers } from "../../scripts/tools/select.svelte";

    const bounds = $derived(ui.selected ? ui.selected.bounds : null);

    let x = $derived(bounds ? bounds.pos.x.toFixed(2) : "");
    let y = $derived(bounds ? bounds.pos.y.toFixed(2) : "");

    let w = $derived(bounds ? bounds.size.x.toFixed(2) : "");
    let h = $derived(bounds ? bounds.size.y.toFixed(2) : "");

    let r = $derived(bounds ? bounds.rot : 0);
    let rs = $derived(bounds ? bounds.rot.toFixed(1) : "0");

    let m = $derived(bounds ? bounds.size.y < 0 : false);

    function safeParseFloat(val: string, fallback: number) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
    }

    function applyTransform(triggerPostAction: boolean) {
        if (!bounds) return;

        const xs = safeParseFloat(x, bounds.pos.x);
        const ys = safeParseFloat(y, bounds.pos.y);
        const ws = safeParseFloat(w, bounds.size.x);
        const hs = safeParseFloat(h, bounds.size.y);
        const ms = m ? -1 : 1;

        const actions: PostAction[] = [];

        if (xs !== bounds.pos.x || ys !== bounds.pos.y) {
            const dx = xs - bounds.pos.x;
            const dy = ys - bounds.pos.y;
            translateLayers(ui.selectedLayers, dx, dy, 'current');

            for (const layer of ui.selectedLayers) {
                actions.push({
                    type: "transform",
                    layerID: layer.id,
                    newMatrix: layer.transform.matrix
                });
            }
        }

        if (ws !== bounds.size.x || hs !== bounds.size.y) {
            const scaleX = ws / bounds.size.x;
            const scaleY = (hs / bounds.size.y);
            let center = { x: bounds.pos.x, y: bounds.pos.y };
            scaleLayers(ui.selectedLayers, scaleX, scaleY, center, r, 'current');

            for (const layer of ui.selectedLayers) {
                actions.push({
                    type: "transform",
                    layerID: layer.id,
                    newMatrix: layer.transform.matrix
                });
            }
        }

        if (r !== bounds.rot) {
            let center = { x: bounds.pos.x, y: bounds.pos.y };
            const deltaAngle = r - bounds.rot;
            rotateLayers(ui.selectedLayers, deltaAngle, center, 'current');
            setPreviousRotation(r);

            for (const layer of ui.selectedLayers) {
                actions.push({
                    type: "transform",
                    layerID: layer.id,
                    newMatrix: layer.transform.matrix
                });
            }
        }

        if (triggerPostAction && actions.length > 0) {
            postAction({
                type: "compound",
                actions: actions
            });
        }
    }

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    function debouncedapplyTransform() {
        if (debounceTimeout) return;
        debounceTimeout = setTimeout(() => {
            applyTransform(false); debounceTimeout = null;
        }, 8); // ~1 frame at 60Hz
    }

    function flipH() {
        // if (!t) return;
        // m = !m;
        // r = (t.rotate + 360) % 360 - 180;
        // rs = r.toFixed(1);
        // const ws = t.scale.x * layerSize.width;
        // let xs = t.translate.x, ys = t.translate.y;
        // const sin = Math.sin(r * Math.PI / 180), cos = Math.cos(r * Math.PI / 180);
        // xs -= ws * cos;
        // ys -= ws * sin;
        // x = xs.toFixed(2);
        // y = ys.toFixed(2);
        // applyTransform(true);
    }

    function flipV() {
        // if (!t) return;
        // m = !m;
        // const hs = t.scale.y * layerSize.height;
        // let xs = t.translate.x, ys = t.translate.y;
        // const sin = Math.sin(r * Math.PI / 180), cos = Math.cos(r * Math.PI / 180);
        // xs -= hs * sin;
        // ys += hs * cos;
        // x = xs.toFixed(2);
        // y = ys.toFixed(2);
        // applyTransform(true);
    }

</script>

<Panel title="Transform" disabled={!bounds}>
    <div>
        <Input
            name="x" labelPosition="side" disabled={!bounds}
            bind:value={x} onBlur={() => applyTransform(true)}
        >
            <div class="label">X:</div>
        </Input>
        <Input
            name="y" labelPosition="side" disabled={!bounds}
            bind:value={y} onBlur={() => applyTransform(true)}
        >
            <div class="label">Y:</div>
        </Input>
    </div>
    <div>
        <Input
            name="w" labelPosition="side" disabled={!bounds}
            bind:value={w} onBlur={() => applyTransform(true)}
        >
            <div class="label">W:</div>
        </Input>
        <Input
            name="h" labelPosition="side" disabled={!bounds}
            bind:value={h} onBlur={() => applyTransform(true)}
        >
            <div class="label">H:</div>
        </Input>
    </div>
    <div>
        <Input
            name="r" labelPosition="side" disabled={!bounds} variant="underline"
            style="width: 12ch;"
            bind:value={rs}
            onBlur={() => {
                if (!bounds) return;
                r = safeParseFloat(rs, bounds.rot);
                applyTransform(true);
            }}
        >
            <div class="label">R:</div>
        </Input>
        <Slider
            min={-180} max={180} step={1}
            bind:value={r} onValueChange={debouncedapplyTransform}
            onBlur={() => applyTransform(true)}
        />
    </div>
    <div>
        <div>
            Mirror:
            <Checkbox bind:checked={m} onChange={() => applyTransform(true)} />
        </div>
        <div style="justify-content: flex-end">
            <button onclick={() => flipH()}>
                <IconButtonVisual label="Flip horizontally">
                    <FlipHorizontal2 size={16} />
                </IconButtonVisual>
            </button>
            <button onclick={() => flipV()}>
                <IconButtonVisual label="Flip vertically">
                    <FlipVertical2 size={16} />
                </IconButtonVisual>
            </button>
        </div>
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