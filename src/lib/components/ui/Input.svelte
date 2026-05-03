<script lang="ts">
    import type { Snippet } from "svelte";
    import type {
        HTMLInputAttributes,
        HTMLInputTypeAttribute,
    } from "svelte/elements";

    type InputType = Omit<HTMLInputTypeAttribute, "file">;

    type CustomProps = {
        children?: Snippet;
        labelPosition?: "top" | "side";
        variant?: "solid" | "underline";
        hideLabel?: boolean;
    };

    type Props = CustomProps &
        Omit<HTMLInputAttributes, "type"> & {
            ref?: HTMLInputElement | null;
        } & (
            | { type: "file"; files?: FileList }
            | { type?: InputType; files?: undefined }
        );

    let {
        ref = $bindable(null),
        value = $bindable(),
        type,
        files = $bindable(),
        class: className,
        "data-slot": dataSlot = "input",
        children,
        labelPosition = "top",
        variant = "solid",
        hideLabel = false,
        ...restProps
    }: Props = $props();

    /**
     * Handle keydown events for the input field.
     * @param e The keyboard event.
     */
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    }
</script>

<div
    class="input-container"
    class:label-side={labelPosition === "side"}
    class:label-top={labelPosition === "top"}
>
    {#if children}
        <label
            class="input-label"
            for={restProps.id ?? restProps.name}
            class:sr-only={hideLabel}
        >
            {@render children()}
        </label>
    {/if}
    <input
        id={restProps.id ?? restProps.name}
        data-variant={variant}
        bind:value
        onkeydown={handleKeydown}
        {...restProps}
    />
</div>

<style>
    .input-container {
        display: flex;
        gap: var(--s-xs);
    }

    .input-container.label-top {
        flex-direction: column;
        align-items: flex-start;
    }

    .input-container.label-side {
        flex-direction: row;
        align-items: center;
        gap: var(--s-md);
    }

    input {
        min-width: 0;
        max-width: 100%;
        width: 100%;
    }

    label {
        flex-shrink: 0;
    }

    input[data-variant="solid"] {
        border: 1px solid var(--c-txt);
        background-color: var(--c-bg);
        padding: var(--s-xs) var(--s-sm);
        border-radius: var(--r-sm);
        color: var(--c-txt);
    }

    input[data-variant="underline"] {
        border: none;
        border-bottom: 1px solid var(--c-mid);
        background-color: transparent;
        font-size: var(--f-md);
        color: var(--c-txt);
    }

    input[data-variant="underline"]:focus,
    input[data-variant="underline"]:hover {
        border-color: var(--c-txt);
    }
</style>
