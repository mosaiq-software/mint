<script lang="ts">
    import docs from "../scripts/docs.svelte";
    import Instructions from "./Instructions.svelte";
    import Zoom from "./Zoom.svelte";
</script>

{#if docs.selected}
    <footer>
        <Instructions />
        <Zoom />
    </footer>
{/if}

<style>
    footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--c-sur);
        width: 100%;
        height: fit-content;
        flex-shrink: 0;
        padding: var(--s-sm);
        cursor: default;
        font-size: var(--f-sm);
        border-top: var(--s-xs) solid var(--c-mid);
        gap: var(--s-md);
    }
</style>