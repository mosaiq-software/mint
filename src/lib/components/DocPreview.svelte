<script lang="ts">
    import {type Document} from '../scripts/docs.svelte';
    import {getPreviewSize, PREVIEW_MAX_SIZE} from "../scripts/persistence.svelte";

    const {doc}: {doc: Document & { preview: OffscreenCanvas }} = $props();
    let canvas: HTMLCanvasElement;
    const {width, height} = getPreviewSize(doc);

    $effect(() => {
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(doc.preview, 0, 0);
        }
    })
</script>

<div class="wrapper">
    <div class="canvas-wrapper" style="width: {PREVIEW_MAX_SIZE}px; height: {PREVIEW_MAX_SIZE}px">
        <canvas bind:this={canvas} width={width} height={height} style="width: {width}px; height: {height}px"></canvas>
    </div>
    <p class="title">{doc.name}</p>
    <p class="dimensions">{doc.width} x {doc.height}</p>
</div>

<style>
    .canvas-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--s-sm);
        border-radius: var(--s-sm);
        cursor: pointer;
    }

    .wrapper:hover {
        background: var(--c-mid);
    }

    canvas {
        background: #E5E5E5;
    }

    .title {
        font-weight: bold;
    }

    .dimensions {
        opacity: 0.8;
    }

    p {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>