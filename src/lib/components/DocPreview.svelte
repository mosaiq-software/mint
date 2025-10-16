<script lang="ts">
    import docs, {type Document} from '../scripts/docs.svelte';
    import {
        getPreviewSize,
        PREVIEW_MAX_SIZE,
        getDocumentFromDB,
        deleteDocumentFromDB
    } from "../scripts/persistence.svelte";
    import ui from "../scripts/ui.svelte";
    import IconButtonVisual from './ui/IconButtonVisual.svelte';
    import { Ellipsis } from '@lucide/svelte';
    import { Popover } from "melt/builders";

    const {doc, rerenderDocs}: {
        doc: Document & { preview: OffscreenCanvas },
        rerenderDocs: () => void
    } = $props();
    let canvas: HTMLCanvasElement;
    const {width, height} = getPreviewSize(doc);

    $effect(() => {
        if (canvas && doc.preview) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(doc.preview, 0, 0);
        }
    })

    async function selectDoc() {
        docs[doc.id] = await getDocumentFromDB(doc.id);
        ui.selectedLayers[doc.id] = [];
        ui.selectedDocument = doc.id;
    }

    const popover = new Popover();

    async function deleteDoc() {
        await deleteDocumentFromDB(doc);
        rerenderDocs();
    }
</script>

<div class="wrapper">
    <button class="button" onclick={selectDoc}>
        <span class="canvas-wrapper" style="width: {PREVIEW_MAX_SIZE}px; height: {PREVIEW_MAX_SIZE}px">
            <canvas bind:this={canvas} width={width} height={height} style="width: {width}px; height: {height}px"></canvas>
        </span>
        <span class="text title">{doc.name}</span>
        <span class="text dimensions">{doc.width} x {doc.height}</span>
    </button>
    <button class="ellipsis" {...popover.trigger}>
        <IconButtonVisual label="Settings" selected>
            <Ellipsis />
        </IconButtonVisual>
    </button>
    <div {...popover.content} class="context-menu">
        <div {...popover.arrow}></div>
        <button class="warn" onclick={deleteDoc}>Delete</button>
    </div>
</div>

<style>
    .warn {
        color: var(--c-fb-err);
    }

    .context-menu button {
        text-align: left;
        padding: 0 var(--s-sm);
        cursor: pointer;
    }

    .context-menu button:hover {
        background: var(--c-sur);
    }

    .context-menu {
        background: var(--c-mid);
        border: none;
        padding: var(--s-sm);
        border-radius: var(--s-sm);
        box-shadow: 0px 0px 10px 0px var(--c-bg);
    }

    .ellipsis {
        position: absolute;
        top: var(--s-sm);
        right: var(--s-sm);
        opacity: 0;
    }

    .wrapper:hover .ellipsis {
        opacity: 1;
    }

    .canvas-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wrapper {
        position: relative;
    }

    .button {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--s-sm);
        border-radius: var(--s-sm);
        cursor: pointer;
    }

    .button:hover {
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