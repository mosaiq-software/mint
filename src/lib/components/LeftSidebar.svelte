<script lang="ts">
    import { Brush, MousePointer2, Eraser, Type, MoveHorizontal } from "@lucide/svelte";
    import { IconButtonVisual } from "./ui";
    import { RadioGroup, Popover } from "melt/builders";
    import ui, { modes } from "../scripts/ui.svelte";
    import type { Mode } from "../scripts/ui.svelte";
    import { getSelectedDoc, type Color } from "../scripts/docs.svelte";
    import { colorToCSS } from "../scripts/docs.svelte";
    import ColorPicker from "./overlays/ColorPicker.svelte";
    import { onMount, onDestroy } from "svelte";

    const modesGroup = new RadioGroup({
        value: modes[0],
        onValueChange: (val) => (ui.mode = val as Mode),
    });

    const doc = $derived(getSelectedDoc());

    const source: {
        foregroundColor: Color;
        backgroundColor: Color;
    } = $derived.by(() => {
        if (!doc || !ui.selectedDocument) return ui;
        const selectedLayers = ui.selectedLayers[ui.selectedDocument];
        if (selectedLayers.length === 1)
            return doc.layers.find((l) => l.id === selectedLayers[0]) || ui;
        return ui;
    });

    let editingColor: "foreground" | "background" | null = $state(null);
    const editColorPopover = new Popover({
        floatingConfig: {
            computePosition: {
                placement: "right-end"
            }
        },
        closeOnOutsideClick: false
    });

    function swapColors() {
        const fg = { ...source.foregroundColor };
        source.foregroundColor = { ...source.backgroundColor };
        source.backgroundColor = fg;
    }

    onMount(() => {
        function handleMouseDown(event: MouseEvent) {
            const contentEl = document.getElementById(editColorPopover.ids.content);
            const containsContent = contentEl?.contains(event.target as Node);

            const triggerEls = document.querySelectorAll(`.popover-trigger`);
            const containsTrigger = Array.from(triggerEls).some(el =>
                el.contains(event.target as Node)
            );

            if (
                editColorPopover.open &&
                !containsContent &&
                !containsTrigger
            ) editColorPopover.open = false;
        }
        document.addEventListener("mousedown", handleMouseDown);
        onDestroy(() => {
            document.removeEventListener("mousedown", handleMouseDown);
        });
    });
</script>


<div {...modesGroup.root} id="left-sidebar">
    <div id="tools">
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
        <div {...modesGroup.getItem("text").attrs}>
            <IconButtonVisual
                label="Text"
                showLabel
                selected={modesGroup.value === "text"}
            >
                <Type color="var(--c-txt)" />
            </IconButtonVisual>
        </div>
    </div>
    <div id="colors">
        <button
            {...editColorPopover.trigger}
            class="popover-trigger"
            id="color-background"
            title="Background Color"
            style:border-color={colorToCSS(source.backgroundColor)}
            onclick={(e) => {
                e.preventDefault();
                if (!editColorPopover.open || editingColor == "background")
                    editColorPopover.trigger.onclick(e);
                editingColor = "background";
            }}
        ></button>
        <button
            {...editColorPopover.trigger}
            class="popover-trigger"
            id="color-foreground"
            title="Foreground Color"
            style:background-color={colorToCSS(source.foregroundColor)}
            onclick={(e) => {
                e.preventDefault();
                if (!editColorPopover.open || editingColor == "foreground")
                    editColorPopover.trigger.onclick(e);
                editingColor = "foreground";
            }}
        ></button>
        <button id="swap-colors" title="Swap Colors" onclick={swapColors}>
            <MoveHorizontal color="var(--c-txt)" size={16}/>
        </button>
        <div {...editColorPopover.content} class="context-menu">
            <div {...editColorPopover.arrow}></div>
            {#if editingColor === "foreground"}
                <ColorPicker bind:color={source.foregroundColor} />
            {:else if editingColor === "background"}
                <ColorPicker bind:color={source.backgroundColor} />
            {/if}
        </div>
    </div>
</div>

<style>
    .context-menu {
        background: var(--c-mid);
        border: none;
        padding: var(--s-sm);
        border-radius: var(--s-sm);
        box-shadow: 0px 0px 10px 0px var(--c-bg);
    }

    #left-sidebar {
        padding: 0 var(--s-sm);
        background-color: var(--c-sur);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    #tools {
        display: flex;
        flex-direction: column;
        gap: var(--s-sm);
    }

    #colors {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: var(--s-xl);
    }

    #color-foreground {
        width: 30px;
        aspect-ratio: 1 / 1;
        border-radius: var(--r-full);
        outline: 1px solid var(--c-mid);
        margin-top: -13px;
        cursor: pointer;
    }

    #color-background {
        width: 25px;
        aspect-ratio: 1 / 1;
        border-radius: var(--r-full);
        border: 5px solid var(--c-txt);
        box-sizing: border-box;
        outline: 1px solid var(--c-mid);
        cursor: pointer;
    }

    #swap-colors {
        cursor: pointer;
    }
</style>