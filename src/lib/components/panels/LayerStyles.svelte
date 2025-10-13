<script lang="ts">
    import Panel from "./Panel.svelte";
    import Slider from "../ui/Slider.svelte";
    import {Input} from "../ui";
    import {getSelectedDoc} from "../../scripts/docs.svelte";
    import ui from "../../scripts/ui.svelte";

    const doc = $derived(getSelectedDoc());
    const selectedLayer = $derived.by(() => {
        if (!doc) return null;
        return doc.layers.find((l) => ui.selectedLayers[doc.id].includes(l.id));
    });
    const selectedLayerId = $derived(selectedLayer?.id);

    let opacity = $derived(selectedLayer?.opacity || 0);
    let opacityStr = $derived(opacity.toFixed(2));

    function safeParseFloat(val: string, fallback: number, min: number = Number.NEGATIVE_INFINITY, max: number = Number.POSITIVE_INFINITY) {
        const parsed = parseFloat(val);
        return (isNaN(parsed) || parsed < min || parsed > max) ? fallback : parsed;
    }

    function updateLayer() {
        const layer = getSelectedDoc()?.layers.find((l) => l.id === selectedLayerId);
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

<Panel title="Layer Styles">
    <div>
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
            <div class="label">Op: </div>
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