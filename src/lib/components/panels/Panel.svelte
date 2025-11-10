<script lang="ts">
    import type { Snippet } from "svelte";
    const { title, disabled, children }: { title?: string, disabled?: boolean, children: Snippet, scrollable?: boolean} = $props();
</script>

<div id="panel" class:disabled={disabled ?? false}>
    {@render children()}
</div>

<style>
    #panel {
        display: flex;
        flex-direction: column;
        gap: var(--s-sm);
        flex: 0 0 auto;
        min-height: 0;
        padding-bottom: var(--s-md);
    }

    #panel.disabled {
        opacity: 0.5;
        pointer-events: none;
    }

    #panel:not(:last-child) {
        border-bottom: 1px solid var(--c-mid);
    }
</style>