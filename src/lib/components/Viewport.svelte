<script lang="ts">
    import ui from "../state/ui.svelte";
    import Welcome from "./Welcome.svelte";
</script>

<div id="viewport">
    {#if !ui.selectedDocument}
        <Welcome />
    {:else}
        <p>Document: {ui.selectedDocument}</p>
    {/if}
</div>

<style>
    #viewport {
        flex: 1;
        background-color: var(--c-bg);
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>