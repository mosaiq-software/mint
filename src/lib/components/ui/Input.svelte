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
        onBlur?: (e: FocusEvent) => void;
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
        onblur={onBlur}
        onkeydown={handleKeydown}
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
        font-size: var(--f-md);
        color: var(--c-txt);
    }
</style>