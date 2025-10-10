<script lang="ts">
    import type { TextLayer } from "../../scripts/layer";
    import { getSelectedDoc } from "../../scripts/docs.svelte";
    import { colorToCSS } from "../../scripts/docs.svelte";

    interface Props {
        layer: TextLayer;
    }

    let { layer = $bindable() }: Props = $props();

    const doc = $derived(getSelectedDoc());

    const text = $derived(layer.text);
    const m = $derived(layer.transform.matrix);

    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        layer.text = target.value;
        if (doc) doc.layers = [...doc.layers]; // trigger reactivity
    }
</script>

<div
    id="text-edit-container"
    style:width={layer.width + 2 + 'px'}
    style:height={layer.height + 2 + 'px'}
>
    <textarea
        value={text}
        oninput={handleInput}
        style:font-family={layer.fontFamily}
        style:font-size={layer.fontSize + 'px'}
        style:line-height={layer.lineHeight}
        spellcheck="false"
        style:caret-color={colorToCSS(layer.foregroundColor)}
    ></textarea>
    <div class="resize-handle"></div>
</div>

<style>
    #text-edit-container {
        position: absolute;
        top: var(--s-xl);
        left: var(--s-xl);
        outline: 2px solid var(--c-acc);
        outline-style: dashed;
        box-sizing: border-box;
        transform-origin: top left;
    }

    textarea {
        position: absolute;
        inset: 0;
        resize: none;
        border: none;
        outline: none;
        padding: 0;
        margin-top: -4px;
        background: transparent;
        overflow: hidden;
        white-space: pre-wrap;
        word-break: break-word;
        color: transparent;
    }

    .resize-handle {
        position: absolute;
        width: 10px;
        height: 10px;
        background: var(--c-txt);
        border: 1px solid var(--c-bg);
        bottom: -5px;
        right: -5px;
        pointer-events: none;
    }
</style>