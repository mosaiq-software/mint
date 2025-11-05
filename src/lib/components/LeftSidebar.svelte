<script lang="ts">
    import {Brush, MousePointer2, Eraser, Type, MoveHorizontal, Ellipsis} from "@lucide/svelte";
    import { IconButtonVisual } from "./ui";
    import { RadioGroup, Popover } from "melt/builders";
    import ui, { modes } from "../scripts/ui.svelte";
    import type { Mode } from "../scripts/ui.svelte";
    import docs, { type Color } from "../scripts/docs.svelte";
    import { colorToCSS } from "../scripts/docs.svelte";
    import ColorPicker from "./overlays/ColorPicker.svelte";
    import { onMount, onDestroy } from "svelte";
    import FileMenu from "./overlays/FileMenu.svelte";
    import Tool from "./ui/Tool.svelte";

    let popoverOpen = $state(false);
    const getPopoverOpen = () => popoverOpen;

    const fileMenuPopover = new Popover({
        floatingConfig: {
            computePosition: {
                placement: 'right-start'
            }
        },
        open: getPopoverOpen,
        onOpenChange: (open) => popoverOpen = open,
    });

    const modesGroup = new RadioGroup({
        value: modes[0],
        onValueChange: (val) => (ui.mode = val as Mode),
    });

    const source: {
        foregroundColor: Color;
        backgroundColor: Color;
    } | null = $derived.by(() => {
        if (!docs.selected || !ui.selected) return null;
        const selectedLayer = ui.selected.selectedLayers[0] ?? null;
        if (selectedLayer) return docs.selected.layers.find((l) => l.id === selectedLayer) ?? ui.selected;
        return ui.selected;
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
        if (!source) return;

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
        <button {...fileMenuPopover.trigger}>
            <Tool name="Mint"><Ellipsis /></Tool>
        </button>
        <div {...fileMenuPopover.content} class="popover">
            <div {...fileMenuPopover.arrow}></div>
            <FileMenu bind:open={popoverOpen} />
        </div>
        <div {...modesGroup.getItem("select").attrs}>
            <Tool name="Select" keybind="S" selected={modesGroup.value === "select"}>
                <MousePointer2 />
            </Tool>
        </div>
        <div {...modesGroup.getItem("draw").attrs}>
            <Tool name="Draw" keybind="D" selected={modesGroup.value === "draw"}>
                <Brush />
            </Tool>
        </div>
        <div {...modesGroup.getItem("erase").attrs}>
            <Tool name="Erase" keybind="E" selected={modesGroup.value === "erase"}>
                <Eraser />
            </Tool>
        </div>
        <div {...modesGroup.getItem("text").attrs}>
            <Tool name="Text" keybind="T" selected={modesGroup.value === "text"}>
                <Type />
            </Tool>
        </div>
    </div>
    <div id="colors" class:disabled={!source}>
        <button
            {...editColorPopover.trigger}
            class="popover-trigger"
            disabled={!source}
            id="color-background"
            title="Background Color"
            style:border-color={source ? colorToCSS(source.backgroundColor) : '#fff'}
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
            disabled={!source}
            id="color-foreground"
            title="Foreground Color"
            style:background-color={source ? colorToCSS(source.foregroundColor) : '#000'}
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
        {#if source}
            <div {...editColorPopover.content} class="popover">
                <div {...editColorPopover.arrow}></div>
                {#if editingColor === "foreground"}
                    <ColorPicker bind:color={source.foregroundColor} />
                {:else if editingColor === "background"}
                    <ColorPicker bind:color={source.backgroundColor} />
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    #left-sidebar {
        padding: var(--s-sm);
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

    #colors.disabled {
        opacity: 0.5;
        pointer-events: none;
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