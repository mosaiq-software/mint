<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        name: string;
        children: Snippet
        type?: 'text' | 'password' | 'email' | 'number';
        labelPosition?: 'top' | 'side';
        variant?: 'solid' | 'underline',
        style?: string;
        placeholder?: string;
        value?: string;
        disabled?: boolean;
        hideLabel?: boolean;
        onBlur?: (e: FocusEvent) => void;
    }

    let {
        name,
        children,
        type = 'text',
        labelPosition = 'top',
        variant = 'solid',
        style = '',
        placeholder = '',
        value = $bindable(),
        disabled = false,
        hideLabel = false,
        onBlur = (e: FocusEvent) => {}
    }: Props = $props();

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    }
</script>

<div
    class="input-container"
    style={style}
    class:label-side={labelPosition === 'side'}
    class:label-top={labelPosition === 'top'}
>
    <label
        class="input-label"
        for={name}
        class:sr-only={hideLabel}
    >
        {@render children()}
    </label>
    <input
        class="variant-{variant}"
        type={type}
        placeholder={placeholder}
        bind:value
        disabled={disabled}
        onblur={onBlur}
        onkeydown={handleKeydown}
    />
</div>

<style>
    .input-container {
        display: flex;
        gap: var(--s-xs);
        min-width: 5em;
        flex: 1;
    }

    .input-container.label-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .input-container.label-side {
        flex-direction: row;
        align-items: center;
    }

    input {
        min-width: 0;
        max-width: 100%;
        width: 100%;
    }

    input.variant-solid {
        border: 1px solid var(--c-txt);
        background-color: var(--c-bg);
        padding: var(--s-xs) var(--s-sm);
        border-radius: var(--r-sm);
        width: 100%;
        color: var(--c-txt);
    }

    input.variant-underline {
        border: none;
        border-bottom: 1px solid transparent;
        background-color: transparent;
        font-size: var(--f-md);
        color: var(--c-txt);
    }

    input.variant-underline:focus, input.variant-underline:hover {
        border-color: var(--c-txt);
    }
</style>