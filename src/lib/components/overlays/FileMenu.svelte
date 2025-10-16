<script lang="ts">
    import Input from '../ui/Input.svelte';
    import docs from "../../scripts/docs.svelte";
    import {saveDocumentToDB} from "../../scripts/persistence.svelte";

    let widthStr: string = $derived(docs.selected ? docs.selected.width.toString() : '');
    let heightStr: string = $derived(docs.selected ? docs.selected.height.toString() : '');

    function handleCanvasSizeBlur(type: 'width' | 'height', dimStr: string) {
        if (!docs.selected) return dimStr;

        let dim = parseInt(dimStr);
        if (isNaN(dim) || dim <= 0) {
            return `${docs.selected[type]}`;
        } else {
            docs.selected[type] = dim;
            return dimStr;
        }
    }

    function handleSave() {
        if (docs.selected) {
            saveDocumentToDB(docs.selected);
        }
    }
</script>

<div id="file-menu">
    {#if docs.selected}
        <h2>Canvas Size</h2>
        <div id="canvas-size">
            <Input
                type="number"
                name="canvas-width"
                placeholder="Width"
                bind:value={widthStr}
                onBlur={() => {
                    widthStr = handleCanvasSizeBlur('width', widthStr)
                }}
            >Width:</Input>
            <Input
                type="number"
                name="canvas-height"
                placeholder="Height"
                bind:value={heightStr}
                onBlur={() => {
                    heightStr = handleCanvasSizeBlur('height', heightStr)
                }}
            >Height:</Input>
        </div>
        <h2>File</h2>
        <button onclick={handleSave}>Save</button>
    {:else}
        <div>Open a doc to get started.</div>
    {/if}
</div>

<style>
    #file-menu {
        display: flex;
        gap: var(--s-sm);
        align-items: stretch;
        width: 20em;
        flex-direction: column;
    }

    #canvas-size {
        display: flex;
        gap: var(--s-md);
        width: 100%;
    }

    button {
        text-align: left;
        padding: 0 var(--s-sm);
        cursor: pointer;
    }

    button:hover {
        background: var(--c-sur);
    }
</style>