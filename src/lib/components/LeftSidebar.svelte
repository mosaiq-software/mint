<script lang="ts">
    import { Brush, Menu, MousePointer2, Eraser } from "@lucide/svelte";
    import { IconButtonVisual } from "./ui";
    import { RadioGroup } from "melt/builders";
    import ui, { modes } from "../state/ui.svelte";
    import type { Mode } from "../state/ui.svelte";

    const modesGroup = new RadioGroup({
        value: modes[0],
        onValueChange: (val) => (ui.mode = val as Mode),
    });

</script>
<div {...modesGroup.root}>
    <label for=""></label>
    <div {...modesGroup.getItem("select").attrs}>
        <IconButtonVisual
            label="Select"
            showLabel
            selected={modesGroup.value === "select"}
        >
            <MousePointer2 color="var(--c-txt)" />
        </IconButtonVisual>
    </div>
    <div {...modesGroup.getItem("draw").attrs}>
        <IconButtonVisual
            label="Draw"
            showLabel
            selected={modesGroup.value === "draw"}
        >
            <Brush color="var(--c-txt)" />
        </IconButtonVisual>
    </div>
    <div {...modesGroup.getItem("erase").attrs}>
        <IconButtonVisual
            label="Erase"
            showLabel
            selected={modesGroup.value === "erase"}
        >
            <Eraser color="var(--c-txt)" />
        </IconButtonVisual>
    </div>
</div>

<style>
    div {
        display: flex;
        flex-direction: column;
        padding: var(--s-xs);
        background-color: var(--c-sur);
        gap: var(--s-xs);
    }
</style>