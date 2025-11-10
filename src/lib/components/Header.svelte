<script lang="ts">
    import docs, {type Document, type DocumentID} from '../scripts/docs.svelte';
    import { Plus, X } from '@lucide/svelte';
    import {ButtonVisual, IconButtonVisual} from "./ui";
    import ui from "../scripts/ui.svelte";
    import tabStatus from "../scripts/tabStatus.svelte.js";
    import {Popover} from "melt/builders";
    import { selectDocument } from '../scripts/docs.svelte';

    let tabs = $derived.by(() => {
        const {selected, ...rest} = docs;
        const values = Object.values(rest);
        values.sort((a, b) => tabStatus[a.id].tabIndex - tabStatus[b.id].tabIndex);
        return values;
    });

    function handleTabClick(tab: Document | null) {
        selectDocument(tab ? tab.id : null);
    }

    function findClosestDocumentIDByTabIndex(tab: Document, above: boolean): DocumentID | null {
        const selectedTabIndex = tabStatus[tab.id].tabIndex;
        let closestTabIndex = Number.NEGATIVE_INFINITY, closestTabId = tab.id;
        Object.entries(tabStatus).forEach(([id, {tabIndex, ...rest}]) => {
            if (tabIndex === selectedTabIndex) return;
            if (above && tabIndex > selectedTabIndex) return;
            if (!above && tabIndex < selectedTabIndex) return;
            const closestDiff = Math.abs(selectedTabIndex - closestTabIndex);
            const currentDiff = Math.abs(selectedTabIndex - tabIndex);
            if (currentDiff < closestDiff) {
                closestTabIndex = tabIndex;
                closestTabId = id as DocumentID;
            }
        });
        if (closestTabId === tab.id) return null;
        return closestTabId;
    }

    function handleTabDelete(tab: Document) {
        if (docs.selected?.id === tab.id) {
            const closestDocID = findClosestDocumentIDByTabIndex(tab, false) ?? findClosestDocumentIDByTabIndex(tab, true);
            docs.selected = closestDocID ? docs[closestDocID] : closestDocID;
            ui.selectedDocument = closestDocID;
        }
        delete docs[tab.id];
        delete tabStatus[tab.id];
    }

    const deleteWarningPopover = new Popover();
    let docUpForDeletion = $state<null | Document>(null);
</script>

{#if tabs.length > 0}
    <header class="header">
        {#each tabs as tab (tab.id)}
            <div class="{docs.selected?.id === tab.id ? 'selected' : ''} tab">
                <button onclick={() => handleTabClick(tab)} class="name">
                    <span>{tab.name}</span>
                </button>
                <button {...deleteWarningPopover.trigger} onclick={(e) => {
                    if (tabStatus[tab.id].actionsSinceSave === 0) {
                        handleTabDelete(tab);
                    } else {
                        docUpForDeletion = tab;
                        deleteWarningPopover.trigger.onclick(e);
                    }
                }} class="close">
                    <IconButtonVisual
                            label="Close"
                            paddingSMd={true}
                    >
                        <div class="x-wrapper" class:unsaved={tabStatus[tab.id].actionsSinceSave !== 0}>
                            <X size={16} />
                        </div>
                    </IconButtonVisual>
                </button>
            </div>
        {/each}
        <div id="new-tab"
             class="{docs.selected === null ? 'selected' : ''} tab">
            <button onclick={() => handleTabClick(null)}
                    title="New tab"
                    class="name"
            >
                <Plus size={16} />
            </button>
        </div>
        <div {...deleteWarningPopover.content} class="popover">
            <div {...deleteWarningPopover.arrow}></div>
            <div>
                {#if docUpForDeletion}
                    <p>Are you sure you want to close <b>{docUpForDeletion.name}</b>?</p>
                    <p>This document may have unsaved changes.</p>
                    <button class="warning-button" onclick={() => {
                        if (docUpForDeletion) {
                            deleteWarningPopover.open = false;
                            handleTabDelete(docUpForDeletion);
                        }
                    }}>
                        <ButtonVisual color="danger">Close</ButtonVisual>
                    </button>
                {/if}
            </div>
        </div>
    </header>
{/if}

<style>
    .popover p {
        cursor: default;
    }

    .close:not(:hover) .unsaved {
        background: var(--c-txt);
        border-radius: 50%;
        transform: scale(0.5);
    }

    .tab {
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

    .tab.selected button.name {
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

    .tab:first-child, .tab:hover, .tab:hover + .tab, .tab.selected, .selected + .tab {
        border-left-color: transparent;
    }

    .tab:hover {
        background: var(--c-mid);
    }

    #new-tab {
        flex-grow: 0;
    }

    .tab.selected, .tab.selected:hover {
        background: var(--c-bg);
        cursor: default;
    }

    .tab.selected, .tab:hover {
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