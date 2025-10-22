<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        label: string;
        showLabel?: boolean;
        selected?: boolean;
        children?: Snippet;
        paddingSMd?: boolean;
    }

    let {
        label,
        showLabel = false,
        selected = false,
        children,
        paddingSMd = false
    }: Props = $props();
</script>

<div class="icon-button" class:selected={selected} class:padding-smd={paddingSMd} aria-label={label}>
    {#if children}
        {@render children()}
    {/if}
    {#if showLabel}
        <span>{label}</span>
    {/if}
</div>

<style>
    .icon-button {
        padding: var(--s-sm);
        border-radius: var(--r-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
    }

    .icon-button.padding-smd {
        padding: var(--s-md);
    }

    .icon-button:hover {
        background-color: var(--c-bg);
    }

    .icon-button.selected {
        background-color: var(--c-bg);
    }

    span {
        font-size: var(--f-sm);
    }
</style>