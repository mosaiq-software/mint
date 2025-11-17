<script lang="ts">
    import Panel from "./Panel.svelte";
    import { Slider } from "../ui";
    import { shape } from "../../scripts/tools/utils/shape.svelte";
    import ui from "../../scripts/ui.svelte";
    import docs from "../../scripts/docs.svelte";
    import { colorToCSS, type Color } from "../../scripts/docs.svelte";

    /**
     * Get active foreground and background colors from UI state,
     * This will be the layer colors if a layer is selected, the
     * global UI colors if no layers are selected, and a default
     * black/white if no documents are open.
     */
    const colors: {
        foregroundColor: Color;
        backgroundColor: Color;
    } = $derived.by(() => {
        if (ui.selectedLayers[0]) {
            return {
                foregroundColor: ui.selectedLayers[0].foregroundColor,
                backgroundColor: ui.selectedLayers[0].backgroundColor
            };
        } else {
            return ui.selected ?? {
                foregroundColor: { r: 0, g: 0, b: 0, a: 1 },
                backgroundColor: { r: 255, g: 255, b: 255, a: 1 }
            }
        };
    });

    /** Get the currently selected shape layer, if any. */
    const selectedShapeLayer = $derived.by(() => {
        if (docs.selected && ui.selected) {
            const layer = docs.selected.layers.find(
                (layer) => layer.id === ui.selected!.selectedLayers[0]
            );

            if (layer && (layer.type === "rectangle" || layer.type === "ellipse")) {
                return layer;
            }
        }

        return null;
    });

    /**
     * Get the source of shape properties, either from the selected
     * shape layer or from the global shape tool settings.
     */
    const shapeSource = $derived(selectedShapeLayer ?? shape);

    /**
     * Get the corner radius, either from the selected shape layer
     * (if it's a rectangle) or from the global shape tool settings.
     */
    const cornerRadius = $derived(
        selectedShapeLayer && selectedShapeLayer.type === "rectangle"
            ? selectedShapeLayer.cornerRadius
            : shape.cornerRadius
    );

    /**
     * Get the border radius for the shape preview, accounting for
     * stroke alignment and shape type.
     */
    const borderRadius = $derived.by(() => {
        if (selectedShapeLayer && selectedShapeLayer.type === "ellipse") {
            return 9999;
        } else {
            if (shapeSource.strokeAlign === "inside") return cornerRadius;
            else if (shapeSource.strokeAlign === "center") return cornerRadius + shapeSource.strokeWidth / 2;
            else return cornerRadius + shapeSource.strokeWidth;
        }
    });

    /**
     * Update the corner radius of the selected shape layer
     * or the global shape tool settings.
     * @param value The new corner radius value.
     */
    function updateCornerRadius(value: number) {
        if (selectedShapeLayer && selectedShapeLayer.type === "rectangle") {
            selectedShapeLayer.cornerRadius = value;
        } else {
            shape.cornerRadius = value;
        }
    }
</script>

<Panel title="Shape">
    <div id="container">
        <div id="controls">
            <div class="control">
                <div>
                    <label for="stroke-width">Stroke Width</label>
                    <span>{Math.round(shapeSource.strokeWidth * 10) / 10}px</span>
                </div>
                <Slider bind:value={shapeSource.strokeWidth} min={0} max={100} step={0.1} />
            </div>
            <div class="control" class:disabled={selectedShapeLayer?.type === "ellipse"}>
                <div>
                    <label for="feather">Corner Radius</label>
                    <span>{Math.round(cornerRadius * 10) / 10}px</span>
                </div>
                <Slider value={cornerRadius} onValueChange={updateCornerRadius} min={0} max={100} step={1} />
            </div>
            <div class="control-horizontal">
                <label for="stroke-alignment">Stroke Align</label>
                <select bind:value={shapeSource.strokeAlign} id="stroke-alignment">
                    <option value="inside">Inside</option>
                    <option value="center">Center</option>
                    <option value="outside">Outside</option>
                </select>
            </div>
        </div>
        <div id="preview">
            <div
                id="shape-preview"
                style:border-width={`${Math.min(shapeSource.strokeWidth, 38)}px`}
                style:border-start-start-radius="{borderRadius}px"
                style:border-color="{colorToCSS(colors.backgroundColor)}"
                style:background-color="{colorToCSS(colors.foregroundColor)}"
            ></div>
        </div>
    </div>
</Panel>

<style>
    #container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    #controls {
        flex: 1;
    }

    #preview {
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid var(--c-mid);
        border-radius: var(--r-md);
        margin-left: 1rem;
        position: relative;
    }

    #shape-preview {
        position: absolute;
        inset: 5px;
        border-style: solid;
        border-bottom-style: none;
        border-right-style: none;
    }

    .control {
        display: flex;
        flex-direction: column;
    }

    .control-horizontal {
        display: flex;
        flex-direction: row;
        gap: var(--s-md);
        align-items: center;
        margin-top: var(--s-xs);
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

    .control.disabled {
        opacity: 0.5;
        pointer-events: none;
    }
</style>