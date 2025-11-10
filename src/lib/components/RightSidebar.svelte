<script lang="ts">
    import Brush from "./panels/Brush.svelte";
    import Shape from "./panels/Shape.svelte";
    import Layers from "./panels/Layers.svelte";
    import Transform from "./panels/Transform.svelte";
    import Type from "./panels/Type.svelte";
    import LayerStyles from "./panels/LayerStyles.svelte";
    import { Accordion, type AccordionItem } from "melt/builders";
    import { ChevronRight } from "@lucide/svelte";

    type Item = AccordionItem<{
        title: string,
    }>;

    const toolNames = [
        'Type', 'Brush', 'Shape', 'Layers', 'Layer Styles', 'Transform'
    ];

    const accordion = new Accordion({multiple: true, value: toolNames});

    const items: Item[] = toolNames.map(title => accordion.getItem({title, id: title}));
</script>

<div {...accordion.root} id="sidebar">
    {#each items as item}
        <h2 {...item.heading}>
            <button {...item.trigger}>
                <span>
                    {item.item.title}
                </span>
                <i style:transform={item.isExpanded ? 'rotate(90deg)' : ''}>
                    <ChevronRight size={16} />
                </i>
            </button>
        </h2>
        <div {...item.content}
             class:content={true}
             class:closed={!item.isExpanded}
        >
            {#if item.item.title === 'Type'}
                <Type />
            {:else if item.item.title === 'Brush'}
                <Brush />
            {:else if item.item.title === 'Shape'}
                <Shape />
            {:else if item.item.title === 'Layers'}
                <Layers />
            {:else if item.item.title === 'Layer Styles'}
                <LayerStyles />
            {:else if item.item.title === 'Transform'}
                <Transform />
            {/if}
        </div>
    {/each}
</div>

<style>
    #sidebar {
        background-color: var(--c-sur);
        width: 250px;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: scroll;
    }

    h2 {
        padding: 0 var(--s-sm);
    }

    button {
        width: 100%;
        text-align: left;
        cursor: pointer;
        padding: var(--s-sm);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    h2:not(:first-child) button {
        border-top: var(--s-xs) solid var(--c-mid);
    }

    button:hover {
        background: var(--c-mid);
    }

    .closed {
        display: none;
    }

    .content {
        padding: var(--s-md);
    }
</style>