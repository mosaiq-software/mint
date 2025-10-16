<script lang="ts">
    import Panel from "./Panel.svelte";
    import Slider from "../ui/Slider.svelte";
    import {Input} from "../ui";
    import docs from "../../scripts/docs.svelte";
    import ui from "../../scripts/ui.svelte";

    const selectedLayer = $derived.by(() => {
        if (!docs.selected) return null;
        return docs.selected.layers.find((l) => ui.selectedLayers[docs.selected!.id].includes(l.id));
    });
    const selectedLayerId = $derived(selectedLayer?.id);

    let opacity = $derived(selectedLayer?.opacity || 0);
    let opacityStr = $derived(opacity.toFixed(2));

    function safeParseFloat(val: string, fallback: number, min: number = Number.NEGATIVE_INFINITY, max: number = Number.POSITIVE_INFINITY) {
        const parsed = parseFloat(val);
        return (isNaN(parsed) || parsed < min || parsed > max) ? fallback : parsed;
    }

    function updateLayer() {
        const layer = docs.selected?.layers.find((l) => l.id === selectedLayerId);
        if (layer) {
            layer.opacity = opacity;
        }
    }

    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    function debouncedUpdateLayer() {
        if (debounceTimeout) return;
        debounceTimeout = setTimeout(() => {
            updateLayer();
            debounceTimeout = null;
        }, 8);
    }
</script>

<Panel title="Layer Styles" disabled={!selectedLayer}>
    <div>
        <div class="label">Opacity: </div>
        <Input
            name="r" labelPosition="side" disabled={!selectedLayer} variant="underline"
            style="flex-grow: 1; flex-shrink: 0"
            bind:value={opacityStr}
            onBlur={() => {
                if (!selectedLayer) return;
                opacity = safeParseFloat(opacityStr, selectedLayer?.opacity, 0, 1);
                opacityStr = opacity.toFixed(2);
                updateLayer();
            }}
        >
            <div></div>
        </Input>
        <Slider
            min={0} max={1} step={0.01}
            bind:value={opacity}
            onValueChange={debouncedUpdateLayer}
        />
    </div>
</Panel>

<style>
    div {
        display: flex;
        gap: var(--s-md);
        align-items: center;
        flex: 1;
    }
</style>