<script lang="ts">
    import { Toggle } from "melt/builders";
    import IconButtonVisual from "./IconButtonVisual.svelte";
    import type { Snippet } from "svelte";

    interface Props {
        value?: boolean;
        label: string;
        onValueChange?: (value: boolean) => void;
        disabled?: boolean;
        children: Snippet;
    }

    let {
        value = $bindable(),
        label,
        onValueChange = () => {},
        disabled = false,
        children
    }: Props = $props();

    const toggle = new Toggle({
        value,
        onValueChange: (val) => {
            if (value !== undefined) { value = val; onValueChange(val); }
        },
    });

    $effect(() => {
        if (value !== undefined && toggle.value !== value) toggle.value = value;
    })
</script>

<button
    {...toggle.trigger}
    class="icon-toggle"
    aria-label="Icon Toggle"
    disabled={disabled}
    class:disabled={disabled}
    class:pressed={toggle.value}
>
    <IconButtonVisual selected={toggle.value} {label}>
        {@render children()}
    </IconButtonVisual>
</button>