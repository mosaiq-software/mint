<script lang="ts">
    import { Popover } from "melt/builders";
    import { Ellipsis } from "@lucide/svelte";
    import { IconButtonVisual } from "./ui";
    import FileMenu from "./overlays/FileMenu.svelte";

    const popover = new Popover();
</script>

<header class="header">
    <button {...popover.trigger}>
        <IconButtonVisual
            label="Select"
        >
            <Ellipsis />
        </IconButtonVisual>
    </button>
    <div {...popover.content} class="context-menu">
        <div {...popover.arrow}></div>
        <FileMenu />
    </div>
    <h1 class="title">Mint Editor</h1>
</header>

<style>
    .context-menu {
        background: var(--c-mid);
        border: none;
        padding: var(--s-sm);
        border-radius: var(--s-sm);
        box-shadow: 0px 0px 10px 0px var(--c-bg);
        margin-left: var(--s-xs);
    }

    header {
        display: flex;
        justify-content: start;
        gap: var(--s-md);
        align-items: center;
        background-color: var(--c-sur);
        padding: var(--s-md);
    }
</style>