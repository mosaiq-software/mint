<script lang="ts">
    import type { Snippet } from "svelte";
    const { title, disabled, children }: { title?: string, disabled?: boolean, children: Snippet} = $props();
</script>

<div id="panel" class:disabled={disabled ?? false}>
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

    #panel.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    #panel:not(:last-child) {
        border-bottom: 1px solid var(--c-mid);
        padding-bottom: var(--s-md);
    }
</style>