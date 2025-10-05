<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        size?: 'small' | 'medium' | 'large';
        color?: 'text' | 'accent' | 'success' | 'danger' | 'warning';
        style?: 'solid' | 'outline' | 'subtle';
        width?: 'full' | 'auto';
        disabled?: boolean;
        loading?: boolean;
        children: Snippet;
    }

    const {
        size = 'medium',
        color = 'accent',
        style = 'solid',
        width = 'auto',
        disabled = false,
        loading = false,
        children,
    }: Props = $props();
</script>

<div
    class={`button-visual size-${size} color-${color} style-${style} width-${width}`}
    class:disabled={disabled}
    class:loading={loading}
>
    {@render children()}
</div>

<style>
    .button-visual {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--r-md);
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s, border-color 0.2s, color 0.2s;
    }

    .button-visual.size-small {
        padding: var(--s-xs) var(--s-sm);
        font-size: var(--f-sm);
    }

    .button-visual.size-medium {
        padding: var(--s-sm) var(--s-md);
        font-size: var(--f-md);
    }

    .button-visual.size-large {
        padding: var(--s-md) var(--s-lg);
        font-size: var(--f-md);
    }

    .button-visual.style-solid.color-text {
        background-color: var(--c-txt);
        color: var(--c-bg);
    }

    .button-visual.style-solid.color-accent {
        background-color: var(--c-acc);
        color: var(--c-bg);
    }

    .button-visual.style-solid.color-success {
        background-color: var(--c-fb-suc);
        color: var(--c-bg);
    }

    .button-visual.style-solid.color-danger {
        background-color: var(--c-fb-err);
        color: var(--c-bg);
    }

    .button-visual.style-solid.color-warning {
        background-color: var(--c-fb-wrn);
        color: var(--c-bg);
    }

    .button-visual.style-outline.color-text {
        background-color: transparent;
        border: 1px solid var(--c-txt);
        color: var(--c-txt);
    }

    .button-visual.style-outline.color-accent {
        background-color: transparent;
        border: 1px solid var(--c-acc);
        color: var(--c-acc);
    }

    .button-visual.style-outline.color-success {
        background-color: transparent;
        border: 1px solid var(--c-fb-suc);
        color: var(--c-fb-suc);
    }

    .button-visual.style-outline.color-danger {
        background-color: transparent;
        border: 1px solid var(--c-fb-err);
        color: var(--c-fb-err);
    }

    .button-visual.style-outline.color-warning {
        background-color: transparent;
        border: 1px solid var(--c-fb-wrn);
        color: var(--c-fb-wrn);
    }

    .button-visual.style-subtle {
        background-color: var(--c-mid);
        color: var(--c-txt);
    }

    .button-visual:hover:not(.disabled):not(.loading) {
        filter: brightness(0.9);
    }

    .button-visual.width-full {
        width: 100%;
    }

    .button-visual.disabled,
    .button-visual.loading {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>