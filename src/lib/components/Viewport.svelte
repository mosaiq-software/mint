<script lang="ts">
    import ui from "../scripts/ui.svelte";
    import Welcome from "./Welcome.svelte";
    import Canvas from "./Canvas.svelte";
</script>

<div id="viewport">
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
        width: 0;
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>