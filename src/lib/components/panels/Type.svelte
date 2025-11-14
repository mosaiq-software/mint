<script lang="ts">
    import Panel from "./Panel.svelte";
    import { Input, IconToggle } from "../ui";
    import { getSelectedTextLayer } from "../../scripts/tools/text.svelte";
    import { text } from "../../scripts/tools";
    import ui from "../../scripts/ui.svelte";
    import type { TextProperties } from "../../scripts/layer";
    import { colorToCSS } from "../../scripts/docs.svelte";
    import { Bold, Italic } from "@lucide/svelte";
    import { postAction } from "../../scripts/action";

    const textLayer = $derived(getSelectedTextLayer());
    const p: TextProperties = $derived(textLayer ? textLayer : text.properties);

    /**
     * Get the foreground color for the text preview, either from the
     * selected text layer or from the global UI state. Default to
     * black if no document is open.
     */
    const foregroundColor = $derived(
        textLayer ? textLayer.foregroundColor : ui.selected
            ? ui.selected.foregroundColor : { r: 0, g: 0, b: 0, a: 1 }
    );

    /**
     * Get a suitable background color for the text preview,
     * contrasting with the text color.
     */
    const previewBackgroundColor = $derived.by(() => {
        // calculate the avg. brightness of the foreground color
        const c = foregroundColor;
        const brightness = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
        return brightness < 128 ? "var(--c-txt)" : "var(--c-bg)";
    });

    /** Add an undo/redo action for changing the font family. */
    function handleFontFamilyChange() {
        if (textLayer) {
            postAction({
                type: "update",
                layerID: textLayer.id,
                newLayer: { fontFamily: p.fontFamily }
            });
        }
    }

    let fontSize = $derived(p.fontSize.toString());

    /**
     * Handle changes to the font size input field.
     * Adds an undo/redo action if a text layer is modified.
     */
    function handleFontSizeChange() {
        const value = parseInt(fontSize);
        if (isNaN(value)) return;

        p.fontSize = value;
        if (textLayer) {
            textLayer.fontSize = value;
            postAction({
                type: "update",
                layerID: textLayer.id,
                newLayer: { fontSize: value }
            });
        }
    }

    let lineHeight = $derived(p.lineHeight.toString());

    /**
     * Handle changes to the line height input field.
     * Adds an undo/redo action if a text layer is modified.
     */
    function handleLineHeightChange() {
        const value = parseFloat(lineHeight);
        if (isNaN(value)) return;

        p.lineHeight = value;
        if (textLayer) {
            postAction({
                type: "update",
                layerID: textLayer.id,
                newLayer: { lineHeight: value }
            });
        }
    }

    /** Add an undo/redo action for bold toggle */
    function handleBoldToggle() {
        if (textLayer) {
            postAction({
                type: "update",
                layerID: textLayer.id,
                newLayer: { bold: p.bold }
            });
        }
    }

    /** Add an undo/redo action for italic toggle */
    function handleItalicToggle() {
        if (textLayer) {
            postAction({
                type: "update",
                layerID: textLayer.id,
                newLayer: { italic: p.italic }
            });
        }
    }
</script>

<Panel title="Type">
    <div id="type">
        <div id="preview-container">
            <div id="preview-inputs">
                <Input
                    name="Family"
                    bind:value={p.fontFamily}
                    placeholder="Font Family"
                    labelPosition="side"
                    onBlur={handleFontFamilyChange}
                ><div class="preview-label">Family</div></Input>
                <Input
                    name="Size"
                    type="number"
                    bind:value={fontSize}
                    onBlur={handleFontSizeChange}
                    placeholder="Font Size"
                    labelPosition="side"
                ><div class="preview-label">Size</div></Input>
            </div>
            <div
                id="type-preview"
                style:font-family={p.fontFamily}
                style:color={colorToCSS(foregroundColor)}
                style:background-color={previewBackgroundColor}
                style:font-style={p.italic ? "italic" : "normal"}
                style:font-weight={p.bold ? "bold" : "normal"}
            >Aa</div>
        </div>
        <div id="font-styles">
            <Input
                name="Line Height"
                type="number"
                bind:value={lineHeight}
                onBlur={handleLineHeightChange}
                placeholder="Line Height"
                labelPosition="side"
            >Line Height</Input>
            <div>
                <IconToggle
                    label="Bold"
                    bind:value={p.bold}
                    onValueChange={handleBoldToggle}
                ><Bold size={16}/></IconToggle>
                <IconToggle
                    label="Italic"
                    bind:value={p.italic}
                    onValueChange={handleItalicToggle}
                ><Italic size={16}/></IconToggle>
            </div>
        </div>
    </div>
</Panel>

<style>
    #type {
        display: flex;
        flex-direction: column;
        gap: var(--s-md);
    }

    #type-preview {
        width: 50px;
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid var(--c-mid);
        border-radius: var(--r-md);
        font-size: 24px;
    }

    #preview-container {
        display: flex;
        gap: var(--s-md);
        align-items: center;
    }

    #preview-inputs {
        display: flex;
        flex-direction: column;
        gap: var(--s-sm);
        flex: 1;
    }

    .preview-label {
        width: 35px;
    }

    #font-styles {
        display: flex;
        gap: var(--s-md);
    }
</style>