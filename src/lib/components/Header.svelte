<script lang="ts">
    import { Popover } from "melt/builders";
    import {Ellipsis} from "@lucide/svelte";
    import {IconButtonVisual, Input} from "./ui";
    import {getSelectedDoc} from "../scripts/docs.svelte";

    const popover = new Popover();


    let widthStr = $state(''), heightStr = $state('');

    function handleSummonPopover() {
        let doc = getSelectedDoc();
        if (!doc) return;
        widthStr = `${doc.width}`;
        heightStr = `${doc.height}`;
    }

    function handleBlur(type: 'width' | 'height', dimStr: string) {
        let doc = getSelectedDoc();
        if (!doc) return dimStr;

        let dim = parseInt(dimStr);
        if (isNaN(dim) || dim <= 0) {
            return `${doc[type]}`;
        } else {
            doc[type] = dim;
            return dimStr;
        }
    }
</script>

<header class="header">
    <button {...popover.trigger} onclick={(e) => {
        popover.trigger.onclick(e);
        handleSummonPopover();
    }}>
        <IconButtonVisual
            label="Select"
        >
            <Ellipsis />
        </IconButtonVisual>
    </button>
    <div {...popover.content} class="context-menu">
        <div {...popover.arrow}></div>

        <Input
            type="number"
            name="canvas-width"
            style="solid"
            placeholder="Width"
            bind:value={widthStr}
            onBlur={(e) => {
                widthStr = handleBlur('width', widthStr)
            }}
        >Width</Input>

        <Input
            type="number"
            name="canvas-height"
            style="solid"
            placeholder="Height"
            bind:value={heightStr}
            onBlur={(e) => {
                heightStr = handleBlur('height', heightStr)
            }}
        >Height</Input>

    </div>
    <h1 class="title">Mint Editor</h1>
</header>

<style>
    .context-menu {
        background: var(--c-mid);
        border: none;
        padding: var(--s-sm);
        border-radius: var(--s-sm);
        box-shadow: calc(-1 * var(--s-sm)) var(--s-sm) var(--s-sm) #000;
        margin-left: var(--s-xs);
    }

    header {
        display: flex;
        justify-content: start;
        gap: var(--s-xs);
        align-items: center;
        background-color: var(--c-sur);
        padding: var(--s-xs);
    }
</style>