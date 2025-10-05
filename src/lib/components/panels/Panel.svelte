<script lang="ts">
    import type { Snippet } from "svelte";
    const { title, children }: { title?: string, children: Snippet} = $props();
</script>

<div id="panel">
    {#if title}
        <h2>{title}</h2>
    {/if}
    {@render children()}
</div>

<style>
    #panel {
        display: flex;
        flex-direction: column;
        gap: var(--s-sm);
    }
</style>