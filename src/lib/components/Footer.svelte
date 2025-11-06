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
                <p>
                    Move
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="var(--c-off)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="6" r="3"/>
                        <path d="M12 10v4" />
                        <path d="M9 15h6v6h-6v-6"/>
                        <path d="M3 18h1"/>
                        <path d="M8 18h1"/>
                        <path d="M15 18h1"/>
                        <path d="M20 18h1"/>
                    </svg>
                    to rotate
                </p>
                <p>
                    Move
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="var(--c-off)" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M10 6h1"/><path d="M15 6h1"/><path d="M20 6h1"/>
                        <path d="M6 10v1"/><path d="M6 15v1"/><path d="M6 20v1"/>
                        <path d="M3 3h6v6h-6v-6"/>
                    </svg>
                    to resize
                </p>
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
        {#if tabStatus[docs.selected.id].canRedo}
            <p><kbd>{ctrl}</kbd>{keybindConnector}<kbd>Y</kbd> to redo</p>
        {:else if tabStatus[docs.selected.id].canUndo}
            <p><kbd>{ctrl}</kbd>{keybindConnector}<kbd>Z</kbd> to undo</p>
        {/if}
        {#if tabStatus[docs.selected.id].actionsSinceSave !== 0}
            <p><kbd>{ctrl}</kbd>{keybindConnector}<kbd>S</kbd> to save</p>
        {/if}
        </div>
    </footer>
{/if}

<style>
    i, kbd, svg {
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