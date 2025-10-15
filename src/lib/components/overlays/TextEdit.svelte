<script module>
    let textarea: HTMLTextAreaElement;

    export function focusAndSelect() {
        if (textarea) {
            textarea.focus();
            textarea.select();
        }
    }
</script>

<script lang="ts">
    import type { TextLayer } from "../../scripts/layer";
    import docs from "../../scripts/docs.svelte";
    import { colorToCSS } from "../../scripts/docs.svelte";
    import { postAction } from "../../scripts/action";

    interface Props {
        layer: TextLayer;
    }

    let { layer = $bindable() }: Props = $props();

    const text = $derived(layer.text);
    const m = $derived(layer.transform.matrix);

    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        layer.text = target.value;
        if (docs.selected) docs.selected.layers = [...docs.selected.layers]; // trigger reactivity

        // Reset scroll after the browser's automatic scroll
        requestAnimationFrame(() => {
            target.scrollTop = 0;
            target.scrollLeft = 0;
        });
    }

    function handleBlur() {
        postAction(layer.id, layer);
    }
</script>

<div
    id="text-edit-container"
    style:width={layer.width * Math.hypot(m.a, m.b) + 2 + 'px'}
    style:height={layer.height * Math.hypot(m.c, m.d) + 2 + 'px'}
    style:transform={`translate(${m.e}px, ${m.f}px) rotate(${Math.atan2(m.b, m.a)}rad)`}
>
    <textarea
        bind:this={textarea}
        value={text}
        oninput={handleInput}
        onblur={handleBlur}
        style:font-family={layer.fontFamily}
        style:font-size={layer.fontSize + 'px'}
        style:line-height={layer.lineHeight}
        style:width={layer.width + 'px'}
        style:height={layer.height + 'px'}
        spellcheck="false"
        style:caret-color={colorToCSS(layer.foregroundColor)}
        style:transform={`scale(${Math.hypot(m.a, m.b)}, ${Math.hypot(m.c, m.d)})`}
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
        resize: none;
        border: none;
        outline: none;
        padding: 0;
        top: 1px;
        left: 1px;
        margin-top: -4px;
        background: transparent;
        overflow: hidden;
        white-space: pre-wrap;
        word-break: break-word;
        color: transparent;
        cursor: inherit;
        transform-origin: top left;
    }

    .resize-handle {
        position: absolute;
        width: 10px;
        height: 10px;
        background: var(--c-txt);
        border: 1px solid var(--c-bg);
        bottom: -3px;
        right: -3px;
        pointer-events: none;
    }
</style>