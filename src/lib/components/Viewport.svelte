<script lang="ts">
    import ui from "../scripts/ui.svelte";
    import Welcome from "./Welcome.svelte";
    import Canvas from "./Canvas.svelte";
    import {importImageAsNewDoc} from "../scripts/importImage";

    function handleDragOver(e: DragEvent) {
        if (!ui.selectedDocument) e.preventDefault();
    }

    function handleDrop(e: DragEvent) {
        if (ui.selectedDocument) return;

        e.preventDefault();
        const files = e.dataTransfer?.files;
        if (files) {
            importImageAsNewDoc(files[0]);
        }
    }
</script>

<div id="viewport"
     ondragover={handleDragOver}
     ondrop={handleDrop}
     role="application"
>
    {#if !ui.selectedDocument}
        <Welcome />
    {:else}
        <Canvas />
    {/if}
</div>

<style>
    #viewport {
        background-color: var(--c-bg);
        height: 100%;
        width: 100%;
        min-height: 0;
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>