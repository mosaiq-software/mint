<script lang="ts">
    import Panel from "./Panel.svelte";
    import { Slider, Input } from "../ui";
    import { getSelectedDoc } from "../../scripts/docs.svelte";
    import { matrixToTransformComponents } from "../../scripts/docs.svelte";
    import ui from "../../scripts/ui.svelte";

    const doc = $derived(getSelectedDoc());
    const selectedLayers = $derived.by(() => {
        if (!doc) return [];
        return doc.layers.filter((l) => ui.selectedLayers[doc.id].includes(l.id));
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
    let h = $derived(t ? (t.scale.y * layerSize.height).toFixed(2) : "");

    let r = $derived(t ? t.rotate : 0);
    let rs = $derived(t ? t.rotate.toFixed(1) : "0");

    function safeParseFloat(val: string, fallback: number) {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? fallback : parsed;
    }

    function applyNewMatrix() {
        if (!t) return;

        const xs = safeParseFloat(x, t.translate.x);
        const ys = safeParseFloat(y, t.translate.y);
        const ws = safeParseFloat(w, t.scale.x * layerSize.width) / layerSize.width;
        const hs = safeParseFloat(h, t.scale.y * layerSize.height) / layerSize.height;

        const cos = Math.cos(r * Math.PI / 180);
        const sin = Math.sin(r * Math.PI / 180);
        selectedLayers[0].transform.matrix = new DOMMatrix([
            ws * cos, ws * sin,
            -hs * sin, hs * cos,
            xs, ys
        ]);
    }

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    function debouncedApplyNewMatrix() {
        if (debounceTimeout) return;
        debounceTimeout = setTimeout(() => {
            applyNewMatrix(); debounceTimeout = null;
        }, 8); // ~1 frame at 60Hz
    }
</script>

<Panel title="Transform" disabled={!t}>
    <div>
        <Input
            name="x" labelPosition="side" disabled={!t}
            bind:value={x} onBlur={applyNewMatrix}
        >
            <div class="label">X:</div>
        </Input>
        <Input
            name="y" labelPosition="side" disabled={!t}
            bind:value={y} onBlur={applyNewMatrix}
        >
            <div class="label">Y:</div>
        </Input>
    </div>
    <div>
        <Input
            name="w" labelPosition="side" disabled={!t}
            bind:value={w} onBlur={applyNewMatrix}
        >
            <div class="label">W:</div>
        </Input>
        <Input
            name="h" labelPosition="side" disabled={!t}
            bind:value={h} onBlur={applyNewMatrix}
        >
            <div class="label">H:</div>
        </Input>
    </div>
    <div>
        <Input
            name="r" labelPosition="side" disabled={!t} variant="underline"
            style="width: 12ch;"
            bind:value={rs} onBlur={() => {
                if (!t) return;
                r = safeParseFloat(rs, t.rotate);
                applyNewMatrix();
            }}
        >
            <div class="label">R:</div>
        </Input>
        <Slider
            min={-180} max={180} step={1}
            bind:value={r} onValueChange={debouncedApplyNewMatrix}
        />
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