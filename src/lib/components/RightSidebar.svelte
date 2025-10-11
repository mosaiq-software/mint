<script lang="ts">
    import Brush from "./panels/Brush.svelte";
    import Layers from "./panels/Layers.svelte";
    import Transform from "./panels/Transform.svelte";
    import Type from "./panels/Type.svelte";
</script>

<div>
    <Type />
    <Brush />
    <Layers />
    <Transform />
</div>

<style>
    div {
        background-color: var(--c-sur);
        width: 250px;
        padding: 0 var(--s-md);
        display: flex;
        flex-direction: column;
        gap: var(--s-md);
    }
</style>