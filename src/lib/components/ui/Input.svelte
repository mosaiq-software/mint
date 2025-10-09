<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        name: string;
        children: Snippet
        type?: 'text' | 'password' | 'email' | 'number';
        labelPosition?: 'top' | 'side';
        style?: 'solid',
        placeholder?: string;
        value?: string;
        disabled?: boolean;
        hideLabel?: boolean;
    }

    let {
        name,
        children,
        type = 'text',
        labelPosition = 'top',
        style = 'solid',
        placeholder = '',
        value = $bindable(),
        disabled = false,
        hideLabel = false,
    }: Props = $props();
</script>

<div
    class="input-container"
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
        class:style-solid={style === 'solid'}
        class="input-field"
        type={type}
        placeholder={placeholder}
        bind:value
        disabled={disabled}
    />
</div>

<style>
    .input-container {
        display: flex;
        gap: var(--s-xs);
        width: 100%;
    }

    .input-container.label-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .input-container.label-side {
        flex-direction: row;
        align-items: center;
    }

    input.style-solid {
        border: 1px solid var(--c-txt);
        background-color: var(--c-bg);
        padding: var(--s-sm) var(--s-md);
        border-radius: var(--r-sm);
        width: 100%;
        color: var(--c-txt);
    }
</style>