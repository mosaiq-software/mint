<script lang="ts">
    import Panel from "./Panel.svelte";
    import { Slider } from "../ui";
    import { draw } from "../../scripts/tools";
</script>

<Panel title="Brush">
    <div class="control">
        <label for="size">Size</label>
        <Slider bind:value={draw.brushSize} min={1} max={100} step={0.1} />
    </div>
    <div class="control">
        <label for="feather">Feather</label>
        <Slider bind:value={draw.brushFeather} min={0} max={1} step={0.001} />
    </div>
</Panel>