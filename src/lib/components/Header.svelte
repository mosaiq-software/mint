<script lang="ts">
    import docs, {type Document} from '../scripts/docs.svelte';
    import { Plus, X } from '@lucide/svelte';
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

    function handleTabDelete(tab: Document) {
        if (docs.selected?.id === tab.id) {
            docs.selected = null;
            ui.selectedDocument = null;
        }
        delete docs[tab.id];
    }
</script>

{#if Object.keys(tabs).length > 0}
    <header class="header">
        {#each Object.values(tabs) as tab}
            <div class="{docs.selected?.id === tab.id ? 'selected' : ''}">
                <button onclick={() => handleTabClick(tab)} class="name">
                    <span>{tab.name}</span>
                </button>
                <button onclick={() => handleTabDelete(tab)}>
                    <IconButtonVisual
                            label="Close"
                            paddingSMd={true}
                    >
                        <X size={16} />
                    </IconButtonVisual>
                </button>
            </div>
        {/each}
        <div id="new-tab"
             class="{docs.selected === null ? 'selected' : ''}">
            <button onclick={() => handleTabClick(null)}
                    title="New tab"
                    class="name"
            >
                <Plus size={16} />
            </button>
        </div>
    </header>
{/if}

<style>
    div {
        background: var(--c-sur);
        flex-grow: 1;
        cursor: pointer;
        height: 100%;
        flex-shrink: 0;
        border-left: 1px solid var(--c-mid);
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: stretch;
    }

    button {
        cursor: pointer;
    }

    div.selected button.name {
        cursor: default;
    }

    button.name {
        display: flex;
        align-items: center;
        flex-grow: 1;
        padding: 0 var(--s-md);
    }

    span {
        display: inline-block;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    div:first-child, div:hover, div:hover + div, div.selected, .selected + div {
        border-left-color: transparent;
    }

    div:hover {
        background: var(--c-mid);
    }

    #new-tab {
        flex-grow: 0;
    }

    div.selected, div.selected:hover {
        background: var(--c-bg);
        cursor: default;
    }

    div.selected, div:hover {
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