<script lang="ts">
    import type { Layer } from "../../scripts/layer";
    import { matrixToTransformComponents } from "../../scripts/docs.svelte";
    interface Props {
        layer: Layer;
    }

    const { layer }: Props = $props();
    let t = $derived(matrixToTransformComponents(layer.transform.matrix));

    let layerWidth = $derived(layer.type === 'canvas' ? layer.canvas.width : layer.width);
    let layerHeight = $derived(layer.type === 'canvas' ? layer.canvas.height : layer.height);
</script>
<div
    class="transform-container"
    style="
        width: {layerWidth * t.scale.x + 'px'};
        height: {layerHeight * t.scale.y + 'px'};
    "
>
    <div class="transform-overlay" style="
        transform: 
            translate({t.translate.x}px, {t.translate.y}px)
            rotate({t.rotate}deg)
    ">
        <div class="transform-rotate-container">
            <div class="transform-rotate-handle"></div>
            <div class="transform-rotate-line"></div>
        </div>

        <div class="transform-scale n"></div>
        <div class="transform-scale e"></div>
        <div class="transform-scale s"></div>
        <div class="transform-scale w"></div>
        <div class="transform-scale nw"></div>
        <div class="transform-scale ne"></div>
        <div class="transform-scale sw"></div>
        <div class="transform-scale se"></div>
    </div>
</div>

<style>
    .transform-overlay {
        position: absolute;
        inset: -1px;
        pointer-events: none;
        box-sizing: border-box;
        border: 2px dashed var(--c-acc);
        transform-origin: top left;
    }

    .transform-container {
        /* this is probably not the best way to do this */
        position: absolute;
        top: var(--s-xl);
        left: var(--s-xl);
        pointer-events: none;
    }

    .transform-scale {
        position: absolute;
        width: 10px;
        height: 10px;
        background: var(--c-txt);
        border: 1px solid var(--c-bg);
    }

    .transform-scale.nw {
        top: -6px;
        left: -6px;
    }

    .transform-scale.ne {
        top: -6px;
        right: -6px;
    }

    .transform-scale.se {
        bottom: -6px;
        left: -6px;
    }

    .transform-scale.sw {
        bottom: -6px;
        right: -6px;
    }

    .transform-scale.n {
        top: 50%;
        left: -6px;
        transform: translateY(-50%);
    }

    .transform-scale.e {
        top: 50%;
        right: -6px;
        transform: translateY(-50%);
    }

    .transform-scale.s {
        left: 50%;
        bottom: -6px;
        transform: translateX(-50%);
    }

    .transform-scale.w {
        left: 50%;
        top: -6px;
        transform: translateX(-50%);
    }

    .transform-rotate-container {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .transform-rotate-handle {
        width: 10px;
        height: 10px;
        background: var(--c-txt);
        border: 1px solid var(--c-bg);
        border-radius: 50%;
    }

    .transform-rotate-line {
        width: 2px;
        height: 20px;
        background: var(--c-mid);
        margin-top: -1px;
    }
</style>