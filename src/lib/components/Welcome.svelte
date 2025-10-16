<script lang="ts">
    import { ButtonVisual, Input } from "./ui";
    import docs from "../scripts/docs.svelte";
    import ui from "../scripts/ui.svelte";
    import type { DocumentID } from "../scripts/docs.svelte";
    import {importImageAsNewDoc} from "../scripts/importImage";
    import {getDocumentsFromDB} from "../scripts/persistence.svelte";
    let creatingDocument = $state(false);

    let name = $state("");
    let size = $state({
        width: "800",
        height: "600"
    });
    let creationError: string | null = $state(null);

    function createDocument() {
        const width = parseInt(size.width);
        const height = parseInt(size.height);

        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            creationError = "Please enter valid dimensions.";
            return;
        }

        if (name.trim() === "") {
            creationError = "Please enter a document name.";
            return;
        }

        creationError = null;

        const id = 'document-' + crypto.randomUUID() as DocumentID;
        docs[id] = {
            id, name, width, height, layers: []
        };

        ui.selectedDocument = id;
        ui.selectedLayers[id] = [];
        
        creatingDocument = false;
    }

    function handleImportImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = () => {
            if (input.files) {
                importImageAsNewDoc(input.files[0], () => {
                    creatingDocument = false;
                });
            }
        }
        input.click();
    }
</script>

{#if creatingDocument}
    <div id="create">
        <h2>Create New Document</h2>
        <Input
            name="document-name"
            labelPosition="top"
            placeholder="Document Name"
            bind:value={name}
        >Document Name</Input>
        <div id="canvas-size">
            <p>Canvas Size (Pixels)</p>
            <div>
                <Input
                    type="number"
                    name="canvas-width"
                    placeholder="Width"
                    hideLabel
                    bind:value={size.width}
                >Width</Input>
                <span>x</span>
                <Input
                    type="number"
                    name="canvas-height"
                    placeholder="Height"
                    hideLabel
                    bind:value={size.height}
                >Height</Input>
            </div>
        </div>
        {#if creationError}
            <p class="error" style="color: var(--c-fb-err)">{creationError}</p>
        {/if}
        <button onclick={createDocument}>
            <ButtonVisual size="large" color="accent" style="solid">
                Create
            </ButtonVisual>
        </button>
    </div>
{:else}
    <div id="welcome">
        <h1>Welcome to Mint!</h1>
        <p>Create or open a document to get started.</p>
        <button onclick={() => creatingDocument = true}>
            <ButtonVisual size="large" color="accent" style="solid">
                New Document
            </ButtonVisual>
        </button>
        <button onclick={handleImportImage}>
            <ButtonVisual size="large" color="accent" style="solid">
                Import Image
            </ButtonVisual>
        </button>
        <p>(or drag to import)</p>
        {#await getDocumentsFromDB()}
            <div class="db-message">Loading your documents...</div>
        {:then documents}
            {#if documents.length > 0}
                <!--componentize this later-->
                {#each documents as doc}
                    <div>
                        {doc.name}
                    </div>
                {/each}
            {:else}
                <div class="db-message">No documents found.</div>
            {/if}
        {:catch error}
            <div class="db-message">Error loading your documents: {error}.</div>
        {/await}
    </div>
{/if}

<style>
    .db-message {
        opacity: 0.8;
        font-style: italic;
    }

    #welcome {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-lg);
    }

    #create {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--s-lg);
        width: 300px;
    }

    #canvas-size {
        display: flex;
        flex-direction: column;
        gap: var(--s-xs);
    }

    #canvas-size>div {
        display: flex;
        gap: var(--s-md);
    }
</style>