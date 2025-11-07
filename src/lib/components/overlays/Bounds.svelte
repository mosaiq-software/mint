<script lang="ts">
    import ui from "../../scripts/ui.svelte";
    import select from "../../scripts/tools/select.svelte";

    const b = $derived(select.bounds);
</script>

{#if b}
    <div
        class="transform-container"
        style="
            width: {b.size.x * (ui.selected?.zoom ?? 1) + 'px'};
            height: {b.size.y * (ui.selected?.zoom ?? 1) + 'px'};
        "
    >
        <div class="transform-overlay" style="
            transform: 
                translate({b.pos.x * (ui.selected?.zoom ?? 1)}px, {b.pos.y * (ui.selected?.zoom ?? 1)}px)
                rotate({b.rot}deg)
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
{/if}

<style>
    .transform-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        box-sizing: border-box;
        border: 2px dashed var(--c-acc);
        transform-origin: top left;
    }

    .transform-container {
        position: absolute;
        top: 0;
        left: 0;
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