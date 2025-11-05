<script lang="ts">
    import docs from "../scripts/docs.svelte";
    import ui from "../scripts/ui.svelte";
    import {SquareDashed, ArrowLeft, ArrowRight, ArrowUp, ArrowDown} from "@lucide/svelte";
    import tabStatus from "../scripts/tabStatus.svelte";

    const isMacLike = /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
    const ctrl = isMacLike ? '⌘' : 'Ctrl';

    const keybindConnector = " + ";
    const keySVGSize = 12;

    const selectedLayer = $derived(docs.selected?.layers.find(l => l.id === ui.selected?.selectedLayers[0]));
</script>

{#if docs.selected}
    <footer>
        <div>
        {#if ui.mode === "select"}
            {#if !selectedLayer}
                <p>Click a layer to select</p>
            {:else}
                <p>Move <i><SquareDashed size={16} /></i> to move</p>
                <p>Move <i class="handle r-handle"></i> to rotate</p>
                <p>Move <i class="handle s-handle"></i> to resize</p>
                <p>
                    <kbd><ArrowLeft size={keySVGSize} /></kbd>
                    <kbd><ArrowUp size={keySVGSize} /></kbd>
                    <kbd><ArrowRight size={keySVGSize} /></kbd>
                    <kbd><ArrowDown size={keySVGSize} /></kbd> to move
                </p>
                <p>
                    <kbd>Shift</kbd>
                    {keybindConnector}
                    <kbd><ArrowLeft size={keySVGSize} /></kbd>
                    <kbd><ArrowUp size={keySVGSize} /></kbd>
                    <kbd><ArrowRight size={keySVGSize} /></kbd>
                    <kbd><ArrowDown size={keySVGSize} /></kbd> to move further
                </p>
            {/if}
        {:else if ui.mode === "draw"}
            {#if selectedLayer?.type === "canvas"}
                <p>Click and drag to draw</p>
                <p><kbd>E</kbd> to erase</p>
            {:else}
                <p>Click to make a new canvas layer</p>
            {/if}
        {:else if ui.mode === "erase"}
            {#if selectedLayer?.type === "canvas"}
                <p>Click and drag to erase</p>
                <p><kbd>D</kbd> to draw</p>
            {:else}
                <p>Select a canvas layer to erase</p>
            {/if}
        {:else if ui.mode === "text"}
            {#if selectedLayer?.type === "text"}
                <p>Type in layer to edit text</p>
            {:else}
                <p>Click to make a text layer</p>
            {/if}
        {/if}
        </div>
        <div>
        {#if tabStatus[docs.selected.id].canUndo}
            <p><kbd>{ctrl}</kbd>{keybindConnector}<kbd>Z</kbd> to undo</p>
        {/if}
        {#if tabStatus[docs.selected.id].canRedo}
            <p><kbd>{ctrl}</kbd>{keybindConnector}<kbd>Y</kbd> to redo</p>
        {/if}
        {#if tabStatus[docs.selected.id].actionsSinceSave !== 0}
            <p><kbd>{ctrl}</kbd>{keybindConnector}<kbd>S</kbd> to save</p>
        {/if}
        </div>
    </footer>
{/if}

<style>
    .handle {
        width: 10px;
        height: 10px;
        background: var(--c-txt);
        border: 1px solid var(--c-bg);
    }

    .r-handle {
        border-radius: 50%;
    }

    i, kbd {
        display: inline-block;
        vertical-align: middle;
    }

    p {
        flex-shrink: 0;
        white-space: nowrap;
    }

    p:not(:last-child)::after {
        content: '•';
        color: var(--c-off);
        padding: 0 var(--s-sm);
    }

    div {
        display: flex;
        flex-shrink: 0;
    }

    footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--c-sur);
        width: 100%;
        height: fit-content;
        overflow: auto;
        flex-shrink: 0;
        padding: var(--s-sm);
        cursor: default;
        font-size: var(--f-sm);
        gap: var(--s-xl);
    }
</style>