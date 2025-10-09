<script lang="ts">
    import Brush from "./panels/Brush.svelte";
    import Layers from "./panels/Layers.svelte";
</script>

<div>
    <Brush />
    <Layers />
</div>

<style>
    div {
        background-color: var(--c-sur);
        width: 250px;
        padding: 0 var(--s-md);
    }
</style>