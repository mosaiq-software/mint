<script module>
    /* Script module to hold exported functions */
    let textarea: HTMLTextAreaElement;

    /** Focus and select the textarea. */
    export function focusAndSelect() {
        if (textarea) {
            textarea.focus();
            textarea.select();
        }
    }
</script>

<script lang="ts">
    import type { TextLayer } from "../../scripts/layer";
    import docs, {matrixToTransformComponents} from "../../scripts/docs.svelte";
    import { colorToCSS } from "../../scripts/docs.svelte";
    import { postAction } from "../../scripts/action";
    import ui from "../../scripts/ui.svelte";

    interface Props {
        layer: TextLayer;
    }

    let { layer = $bindable() }: Props = $props();

    const text = $derived(layer.text);
    const m = $derived(layer.transform.matrix);
    const t = $derived(matrixToTransformComponents(m));

    /**
     * Sync layer text content with textarea input
     * @param event Input event
     */
    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        layer.text = target.value;

        // trigger reactivity 
        if (docs.selected) docs.selected.layers = [...docs.selected.layers];

        // keep scroll at top-left
        requestAnimationFrame(() => {
            target.scrollTop = 0;
            target.scrollLeft = 0;
        });
    }

    /** Commit text changes on blur */
    function handleBlur() {
        postAction({
            type: "update",
            layerID: layer.id,
            newLayer: { text: layer.text },
        });
    }
</script>

<div
    id="text-edit-container"
    style:width={layer.width * t.scale.x * (ui.selected?.zoom ?? 1) + 'px'}
    style:height={layer.height * Math.abs(t.scale.y) * (ui.selected?.zoom ?? 1) + 'px'}
    style:transform={`translate(${t.translate.x * (ui.selected?.zoom ?? 1)}px, ${t.translate.y * (ui.selected?.zoom ?? 1)}px)
        rotate(${t.rotate}deg) ${t.scale.y < 0 ? 'scaleY(-1)' : ''}`}
>
    <textarea
        bind:this={textarea}
        value={text}
        oninput={handleInput}
        onblur={handleBlur}
        style:font-family={layer.fontFamily}
        style:font-size={layer.fontSize + 'px'}
        style:font-weight={layer.bold ? 'bold' : 'normal'}
        style:font-style={layer.italic ? 'italic' : 'normal'}
        style:text-decoration={layer.underline ? 'underline' : 'normal'}
        style:line-height={layer.lineHeight}
        style:width={layer.width + 'px'}
        style:height={layer.height + 'px'}
        spellcheck="false"
        style:caret-color={colorToCSS(layer.foregroundColor)}
        style:transform={`scale(${Math.hypot(m.a, m.b) * (ui.selected?.zoom ?? 1)}, ${Math.hypot(m.c, m.d) * (ui.selected?.zoom ?? 1)})`}
    ></textarea>
</div>

<style>
    #text-edit-container {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: top left;
    }

    textarea {
        position: absolute;
        resize: none;
        border: none;
        outline: none;
        padding: 0;
        background: transparent;
        overflow: hidden;
        white-space: pre-wrap;
        word-break: break-word;
        color: transparent;
        cursor: inherit;
        transform-origin: top left;
    }
</style>