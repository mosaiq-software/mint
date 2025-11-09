<script lang="ts">
    import docs from "../../scripts/docs.svelte";
    import type { LayerID } from "../../scripts/layer";
    import { text } from "../../scripts/tools";

    const textLayers = $derived.by(() => {
        if (!docs.selected) return [];
        return docs.selected.layers.filter(l => l.type === 'text');
    });

    // ensure text areas are cleaned up when layers are deleted
    $effect(() => {
        for (const id in text.elements) {
            const layerID = id as LayerID;
            if (text.elements[layerID] === null) {
                delete text.elements[layerID];
            }
        }
    });
</script>

<div id="text-measure-layer">
    {#each textLayers as layer (layer.id)}
        <div class="text-measure"
            bind:this={text.elements[layer.id]}
            style:font-family={layer.fontFamily}
            style:width={layer.width + 'px'}
            style:height={layer.height + 'px'}
            style:font-size={layer.fontSize + 'px'}
             style:font-weight={layer.bold ? 'bold' : 'normal'}
             style:font-style={layer.italic ? 'italic' : 'normal'}
             style:text-decoration={layer.underline ? 'underline' : 'normal'}
            aria-hidden="true"
        >{layer.text}</div>
    {/each}
</div>

<style>
    #text-measure-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        overflow: hidden;
        pointer-events: none;
    }

    .text-measure {
        position: absolute;
        top: 0;
        left: 0;
        white-space: pre-wrap;
        word-break: break-word;
    }
</style>