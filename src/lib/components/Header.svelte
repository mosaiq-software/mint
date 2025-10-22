<script lang="ts">
    import docs, {type Document} from '../scripts/docs.svelte';
    import { Plus } from '@lucide/svelte';
    import {IconButtonVisual} from "./ui";
    import ui from "../scripts/ui.svelte";
    const tabs = $derived.by(() => {
        const {selected, ...rest} = docs;
        return rest;
    });

    function handleTabClick(tab: Document | null) {
        docs.selected = tab;
        ui.selectedDocument = tab?.id ?? null;
    }
</script>

{#if Object.keys(tabs).length > 0}
    <header class="header">
        {#each Object.values(tabs) as tab}
            <button onclick={() => handleTabClick(tab)}
                    title="{tab.name}"
                    class="{docs.selected?.id === tab.id ? 'selected' : ''}"
            >{tab.name}</button>
        {/each}
        <button onclick={() => handleTabClick(null)}
                title="New tab"
                id="new-tab"
                class="{docs.selected === null ? 'selected' : ''}"
        >
            <Plus size={16} />
        </button>
    </header>
{/if}

<style>
    button {
        background: var(--c-sur);
        padding: var(--s-md);
        flex-grow: 1;
        cursor: pointer;
        height: 100%;
        flex-shrink: 0;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border-left: 1px solid var(--c-mid);
    }

    button:first-child, button:hover, :hover + button, button.selected, .selected + button {
        border-left-color: transparent;
    }

    button:hover {
        background: var(--c-mid);
    }

    #new-tab {
        flex-grow: 0;
    }

    button.selected, button.selected:hover {
        background: var(--c-bg);
        cursor: default;
    }

    button.selected, button:hover {
        border-top-left-radius: var(--s-md);
        border-top-right-radius: var(--s-md);
    }

    header {
        display: flex;
        justify-content: start;
        align-items: center;
        background-color: var(--c-sur);
        width: 100%;
        height: fit-content;
        overflow: auto;
        flex-shrink: 0;
    }
</style>