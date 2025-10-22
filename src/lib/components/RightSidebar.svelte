<script lang="ts">
    import Brush from "./panels/Brush.svelte";
    import Layers from "./panels/Layers.svelte";
    import Transform from "./panels/Transform.svelte";
    import Type from "./panels/Type.svelte";
    import LayerStyles from "./panels/LayerStyles.svelte";
</script>

<div>
    <Type />
    <Brush />
    <Layers />
    <LayerStyles />
    <Transform />
</div>

<style>
    div {
        background-color: var(--c-sur);
        width: 250px;
        padding: var(--s-md);
        display: flex;
        flex-direction: column;
        gap: var(--s-md);
        height: 100%;
    }
</style>