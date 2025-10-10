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

<textarea
    value={text}
    oninput={handleInput}
    style:font-family={layer.fontFamily}
    style:width={layer.width + 'px'}
    style:height={layer.height + 'px'}
    style:font-size={layer.fontSize + 'px'}
    style:line-height={layer.lineHeight}
    spellcheck="false"
    style:transform={`matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`}
    style:caret-color={colorToCSS(layer.color)}
></textarea>

<style>
    textarea {
        position: absolute;
        top: var(--s-xl);
        left: var(--s-xl);
        resize: none;
        border: none;
        outline: none;
        background: transparent;
        overflow: hidden;
        white-space: pre-wrap;
        word-break: break-word;
        color: transparent;
        transform-origin: top left;
    }
</style>