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
    let h = $derived(t ? (t.scale.y * layerSize.width).toFixed(2) : "");

    let r = $derived(t ? t.rotate : 0);
    $inspect(r);
</script>

<Panel title="Transform" disabled={!t}>
    <div>
        <Input name="x" labelPosition="side" bind:value={x}>
            <label for="transform-x">X:</label>
        </Input>
        <Input name="y" labelPosition="side" bind:value={y}>
            <label for="transform-y">Y:</label>
        </Input>
    </div>
    <div>
        <Input name="w" labelPosition="side" bind:value={w}>
            <label for="transform-W">W:</label>
        </Input>
        <Input name="h" labelPosition="side" bind:value={h}>
            <label for="transform-h">H:</label>
        </Input>
    </div>
    <div>
        <label for="rotation">R:</label>
        <Slider min={-180} max={180} step={1} bind:value={r} />
    </div>
</Panel>

<style>
    label {
        display: inline-block;
        width: 2.5ch;
    }

    div {
        display: flex;
        gap: var(--s-md);
        align-items: center;
    }
</style>