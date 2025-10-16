<script lang="ts">
    import docs, {type Document, selectDocument} from '../scripts/docs.svelte';
    import {
        getPreviewSize,
        PREVIEW_MAX_SIZE,
        getDocumentFromDB,
        deleteDocumentFromDB
    } from "../scripts/persistence.svelte";
    import IconButtonVisual from './ui/IconButtonVisual.svelte';
    import { Ellipsis } from '@lucide/svelte';
    import { Popover } from "melt/builders";

    const {doc, rerenderDocs}: {
        doc: Document & { preview: OffscreenCanvas, lastModified: Date },
        rerenderDocs: () => void
    } = $props();
    let canvas: HTMLCanvasElement;
    const {width, height} = getPreviewSize(doc);

    function getDateString() {
        const date = new Date(doc.lastModified);
        const now = new Date();
        const dateIsToday = date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();
        if (!dateIsToday) {
            return date.toLocaleDateString();
        } else {
            return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        }
    }

    $effect(() => {
        if (canvas && doc.preview) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(doc.preview, 0, 0);
        }
    })

    async function selectDoc() {
        docs[doc.id] = await getDocumentFromDB(doc.id);
        selectDocument(doc.id);
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
        <span class="text title" title={doc.name}>{doc.name}</span>
        <span class="text secondary">{getDateString()}</span>
        <span class="text secondary">{doc.width} x {doc.height}</span>
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
        margin: auto;
    }

    .wrapper {
        position: relative;
        width: 100px;
    }

    .button {
        padding: var(--s-sm);
        border-radius: var(--s-sm);
        cursor: pointer;
        width: 100%;
        overflow: hidden;
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

    .secondary {
        opacity: 0.8;
    }

    .text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: block;
    }
</style>