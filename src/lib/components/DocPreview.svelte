<script lang="ts">
    import docs, {type Document} from '../scripts/docs.svelte';
    import {getPreviewSize, PREVIEW_MAX_SIZE, getDocumentFromDB} from "../scripts/persistence.svelte";
    import ui from "../scripts/ui.svelte";

    const {doc}: {doc: Document & { preview: OffscreenCanvas }} = $props();
    let canvas: HTMLCanvasElement;
    const {width, height} = getPreviewSize(doc);

    $effect(() => {
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            window.setTimeout(() => {
                ctx.drawImage(doc.preview, 0, 0);
            }, 1);
        }
    })

    async function selectDoc() {
        docs[doc.id] = await getDocumentFromDB(doc.id);
        ui.selectedLayers[doc.id] = [];
        ui.selectedDocument = doc.id;
    }
</script>

<button class="wrapper" onclick={selectDoc}>
    <span class="canvas-wrapper" style="width: {PREVIEW_MAX_SIZE}px; height: {PREVIEW_MAX_SIZE}px">
        <canvas bind:this={canvas} width={width} height={height} style="width: {width}px; height: {height}px"></canvas>
    </span>
    <span class="text title">{doc.name}</span>
    <span class="text dimensions">{doc.width} x {doc.height}</span>
</button>

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

    .text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>