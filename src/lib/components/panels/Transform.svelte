<script lang="ts">
    import Panel from "./Panel.svelte";
    import {Slider, Input, Checkbox, IconButtonVisual} from "../ui";
    import docs, { matrixToTransformComponents } from "../../scripts/docs.svelte";
    import ui from "../../scripts/ui.svelte";
    import { postAction } from "../../scripts/action";
    import { FlipVertical2, FlipHorizontal2 } from '@lucide/svelte';

    const selectedLayers = $derived.by(() => {
        if (!docs.selected) return [];
        return docs.selected.layers.filter((l) => ui.selected?.selectedLayers.includes(l.id));
    });

    const t = $derived(
        selectedLayers.length !== 1 ? null :
        matrixToTransformComponents(selectedLayers[0].transform.matrix)
    );

    const layerSize = $derived.by(() => {
        if (selectedLayers.length !== 1) return { width: 0, height: 0 };
        const layer = selectedLayers[0];
        return {
            width: layer.type === 'canvas' ? layer.canvas.width : layer.width,
            height: layer.type === 'canvas' ? layer.canvas.height : layer.height,
        }
    });

    let x = $derived(t ? t.translate.x.toFixed(2) : "");
    let y = $derived(t ? t.translate.y.toFixed(2) : "");

    let w = $derived(t ? (t.scale.x * layerSize.width).toFixed(2) : "");
    let h = $derived(t ? (Math.abs(t.scale.y) * layerSize.height).toFixed(2) : "");

    let r = $derived(t ? t.rotate : 0);
    let rs = $derived(t ? t.rotate.toFixed(1) : "0");

    let m = $derived(t ? t.scale.y < 0 : false);

    function safeParseFloat(val: string, fallback: number) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
    }

    function applyNewMatrix(triggerPostAction: boolean) {
        if (!t) return;

        const xs = safeParseFloat(x, t.translate.x);
        const ys = safeParseFloat(y, t.translate.y);
        const ws = safeParseFloat(w, t.scale.x * layerSize.width) / layerSize.width;
        const hs = safeParseFloat(h, Math.abs(t.scale.y) * layerSize.height) / layerSize.height;
        const ms = m ? -1 : 1;

        const cos = Math.cos(r * Math.PI / 180);
        const sin = Math.sin(r * Math.PI / 180);
        const matrix = new DOMMatrix([
            ws * cos, ws * sin,
            ms * -hs * sin, ms * hs * cos,
            xs, ys
        ]);

        selectedLayers[0].transform.matrix = matrix;

        if (triggerPostAction) {
            postAction({
                type: "transform",
                layerID: selectedLayers[0].id,
                newMatrix: matrix
            });
        }
    }

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    function debouncedApplyNewMatrix() {
        if (debounceTimeout) return;
        debounceTimeout = setTimeout(() => {
            applyNewMatrix(false); debounceTimeout = null;
        }, 8); // ~1 frame at 60Hz
    }

    function flipH() {
        if (!t) return;
        m = !m;
        r = (t.rotate + 360) % 360 - 180;
        rs = r.toFixed(1);
        const ws = t.scale.x * layerSize.width;
        let xs = t.translate.x, ys = t.translate.y;
        const sin = Math.sin(r * Math.PI / 180), cos = Math.cos(r * Math.PI / 180);
        xs -= ws * cos;
        ys -= ws * sin;
        x = xs.toFixed(2);
        y = ys.toFixed(2);
        applyNewMatrix(true);
    }

    function flipV() {
        if (!t) return;
        m = !m;
        const hs = t.scale.y * layerSize.height;
        let xs = t.translate.x, ys = t.translate.y;
        const sin = Math.sin(r * Math.PI / 180), cos = Math.cos(r * Math.PI / 180);
        xs -= hs * sin;
        ys += hs * cos;
        x = xs.toFixed(2);
        y = ys.toFixed(2);
        applyNewMatrix(true);
    }

</script>

<Panel title="Transform" disabled={!t}>
    <div>
        <Input
            name="x" labelPosition="side" disabled={!t}
            bind:value={x} onBlur={() => applyNewMatrix(true)}
        >
            <div class="label">X:</div>
        </Input>
        <Input
            name="y" labelPosition="side" disabled={!t}
            bind:value={y} onBlur={() => applyNewMatrix(true)}
        >
            <div class="label">Y:</div>
        </Input>
    </div>
    <div>
        <Input
            name="w" labelPosition="side" disabled={!t}
            bind:value={w} onBlur={() => applyNewMatrix(true)}
        >
            <div class="label">W:</div>
        </Input>
        <Input
            name="h" labelPosition="side" disabled={!t}
            bind:value={h} onBlur={() => applyNewMatrix(true)}
        >
            <div class="label">H:</div>
        </Input>
    </div>
    <div>
        <Input
            name="r" labelPosition="side" disabled={!t} variant="underline"
            style="width: 12ch;"
            bind:value={rs}
            onBlur={() => {
                if (!t) return;
                r = safeParseFloat(rs, t.rotate);
                applyNewMatrix(true);
            }}
        >
            <div class="label">R:</div>
        </Input>
        <Slider
            min={-180} max={180} step={1}
            bind:value={r} onValueChange={debouncedApplyNewMatrix}
            onBlur={() => applyNewMatrix(true)}
        />
    </div>
    <div>
        <div>
            Mirror:
            <Checkbox bind:checked={m} onChange={() => applyNewMatrix(true)} />
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