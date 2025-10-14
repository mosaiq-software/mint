<script lang="ts">
    import Panel from "./Panel.svelte";
    import { Slider } from "../ui";
    import { draw } from "../../scripts/tools";
    import ui from "../../scripts/ui.svelte";
    import { colorToCSS, getSelectedDoc, type Color } from "../../scripts/docs.svelte";

    const gradientId = $derived(`brush-gradient-${Math.random()}`);
    const colors: {
        foregroundColor: Color;
        backgroundColor: Color;
    } = $derived.by(() => {
        if (!ui.selectedDocument) return ui;
        const selectedLayers = ui.selectedLayers[ui.selectedDocument];
        if (selectedLayers.length === 1) {
            const doc = getSelectedDoc()
            if (!doc) return ui;
            return doc.layers.find((l) => l.id === selectedLayers[0]) || ui;
        }
        return ui;
    });
</script>

<Panel title="Brush">
    <div id="brush-size">
        <div id="size-controls">
            <div class="control">
                <div>
                    <label for="size">Size</label>
                    <span>{Math.round(draw.brushSize * 10) / 10}px</span>
                </div>
                <Slider bind:value={draw.brushSize} min={1} max={100} step={0.1} />
            </div>
            <div class="control">
                <div>
                    <label for="feather">Feather</label>
                    <span>{Math.round(draw.brushFeather * 1000) / 1000}</span>
                </div>
                <Slider bind:value={draw.brushFeather} min={0} max={1} step={0.001} />
            </div>
        </div>
        <div id="size-preview">
            <svg width="50" height="50">
                <defs>
                    <radialGradient id={gradientId}>
                        <stop offset="0%" stop-color={colorToCSS(colors.foregroundColor)} stop-opacity="1" />
                        <stop offset={`${(1 - draw.brushFeather) * 100}%`} stop-color={colorToCSS(colors.foregroundColor)} stop-opacity="1" />
                        <stop offset="100%" stop-color={colorToCSS(colors.foregroundColor)} stop-opacity="0" />
                    </radialGradient>
                </defs>
                <circle
                    cx="50%" cy="50%"
                    r={draw.brushSize / 2}
                    fill={`url(#${gradientId})`}
                />
            </svg>
        </div>
    </div>
</Panel>

<style>
    #brush-size {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    #size-controls {
        flex: 1;
    }

    #size-preview {
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid var(--c-mid);
        border-radius: var(--r-md);
        margin-left: 1rem;
    }

    #size-preview svg {
        width: calc(100% - 4px);
        height: calc(100% - 4px);
        border-radius: calc(var(--r-md) - 2px);
    }

    .control {
        display: flex;
        flex-direction: column;
    }

    .control div {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .control span {
        font-size: var(--f-sm);
        color: var(--c-sec);
    }
</style>