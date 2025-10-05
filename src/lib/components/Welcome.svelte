<script lang="ts">
    import { ButtonVisual, Input } from "./ui";
    import docs from "../state/docs.svelte";
    import ui from "../state/ui.svelte";
    import type { DocumentID } from "../state/docs.svelte";
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

        docs.push({
            id: 'document-' + crypto.randomUUID() as DocumentID,
            name, width, height, layers: []
        });

        ui.selectedDocument = docs[docs.length - 1].id;
        creatingDocument = false;
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
                    style="solid"
                    placeholder="Width"
                    hideLabel
                    bind:value={size.width}
                >Width</Input>
                <span>x</span>
                <Input
                    type="number"
                    name="canvas-height"
                    style="solid"
                    placeholder="Height"
                    hideLabel
                    bind:value={size.height}
                >Height</Input>
            </div>
        </div>
        {#if creationError}
            <p class="error">{creationError}</p>
        {/if}
        <button onclick={createDocument}>
            <ButtonVisual size="large" color="accent" style="solid">
                Create
            </ButtonVisual>
        </button>
    </div>
{:else}
    <div id="welcome">
        <h2>Welcome to Mint!</h2>
        <p>Create or open a document to get started.</p>
        <button onclick={() => creatingDocument = true}>
            <ButtonVisual size="large" color="accent" style="solid">
                New Document
            </ButtonVisual>
        </button>
    </div>
{/if}

<style>
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