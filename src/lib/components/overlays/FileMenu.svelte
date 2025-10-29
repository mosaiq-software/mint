<script lang="ts">
    import Input from '../ui/Input.svelte';
    import docs from "../../scripts/docs.svelte";
    import {handleSave} from "../../scripts/shortcut";
    import {postAction} from "../../scripts/action";
    import {Popover} from 'melt/builders';
    import {ChevronRight} from '@lucide/svelte';
    import {render} from '../../scripts/render';

    let widthStr: string = $derived(docs.selected ? docs.selected.width.toString() : '');
    let heightStr: string = $derived(docs.selected ? docs.selected.height.toString() : '');

    function handleCanvasSizeBlur(type: 'width' | 'height', dimStr: string) {
        if (!docs.selected) return dimStr;

        let dim = parseInt(dimStr);
        if (isNaN(dim) || dim <= 0 || dim === docs.selected[type]) {
            return `${docs.selected[type]}`;
        } else {
            postAction({
                type: 'document',
                oldDocument: {id: docs.selected.id, [type]: docs.selected[type]},
                newDocument: {id: docs.selected.id, [type]: dim}
            });
            docs.selected[type] = dim;
            return dimStr;
        }
    }

    const exportsPopover = new Popover({floatingConfig: {computePosition: {placement: 'right-start'}}});

    function handleExport(filetype: 'png' | 'jpg' | 'webp') {
        if (!docs.selected) return;
        const canvas = document.createElement('canvas');
        canvas.width = docs.selected.width;
        canvas.height = docs.selected.height;
        if (filetype === 'jpg') { // add off-white bg for opaque files
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#E5E5E5';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
        render(canvas, docs.selected, false);
        const dataURL = {
            'png': () => canvas.toDataURL('image/png'),
            'jpg': () => canvas.toDataURL('image/jpeg', 0.9),
            'webp': () => canvas.toDataURL('image/webp', 0.9),
        }[filetype]();
        const a = document.createElement('a');
        a.download = `${docs.selected.name}.${filetype}`;
        a.href = dataURL;
        a.click();
    }
</script>

<div class="file-menu menu">
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
        <button {...exportsPopover.trigger} class="arrowed">
            <span>Export as...</span>
            <ChevronRight style="opacity: 0.5" size={16} />
        </button>
    {:else}
        <div>Open a doc to get started.</div>
    {/if}
    <div {...exportsPopover.content} class="popover">
        <div {...exportsPopover.arrow}></div>
        <div class="menu">
            <button onclick={() => handleExport('png')}>.PNG</button>
            <button onclick={() => handleExport('jpg')}>.JPG</button>
            <button onclick={() => handleExport('webp')}>.WEBP</button>
        </div>
    </div>
</div>

<style>
    .arrowed {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .file-menu {
        width: 20em;
    }

    #canvas-size {
        display: flex;
        gap: var(--s-md);
        width: 100%;
    }

    h2 {
        cursor: default;
    }

</style>