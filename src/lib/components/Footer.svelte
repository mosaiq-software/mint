<script lang="ts">

import docs from "../scripts/docs.svelte";

</script>

{#if docs.selected}
    <footer>
        helloworld
    </footer>
{/if}

<style>
    footer {
        display: flex;
        justify-content: start;
        align-items: center;
        background-color: var(--c-sur);
        width: 100%;
        height: fit-content;
        overflow: auto;
        flex-shrink: 0;
        padding: var(--s-sm);
    }
</style>