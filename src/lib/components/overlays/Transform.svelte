<script lang="ts">
    import type { Transform } from "../../scripts/docs.svelte";
    import type { Layer } from "../../scripts/layer";
    import { getSelectedDoc } from "../../scripts/docs.svelte";
    interface Props {
        layer: Layer;
        transform: Transform;
    }

    const doc = $derived(getSelectedDoc());
    const { layer, transform }: Props = $props();
</script>
<div
    class="transform-container"
    style="
        width: {doc ? doc.width + 'px' : '0px'};
        height: {doc ? doc.height + 'px' : '0px'};
    "
>
    <div class="transform-overlay" style="
        transform: matrix({transform.matrix.a}, {transform.matrix.b}, {transform.matrix.c}, {transform.matrix.d}, {transform.matrix.e}, {transform.matrix.f});
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
        inset: -2px;
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
        top: -5px;
        left: -5px;
    }

    .transform-scale.ne {
        top: -5px;
        right: -5px;
    }

    .transform-scale.se {
        bottom: -5px;
        left: -5px;
    }

    .transform-scale.sw {
        bottom: -5px;
        right: -5px;
    }

    .transform-scale.n {
        top: 50%;
        left: -5px;
        transform: translateY(-50%);
    }

    .transform-scale.e {
        top: 50%;
        right: -5px;
        transform: translateY(-50%);
    }

    .transform-scale.s {
        left: 50%;
        bottom: -5px;
        transform: translateX(-50%);
    }

    .transform-scale.w {
        left: 50%;
        top: -5px;
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