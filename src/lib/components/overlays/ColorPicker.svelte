<script module>
    let previouslyPickedColors: Color[] = $state([]);
</script>

<script lang="ts">
    import type { Color } from "../../scripts/docs.svelte";
    import { hexToColor, colorToHex6 } from "../../scripts/docs.svelte";
    import { Slider } from "../ui";

    let { color = $bindable() }: { color: Color } = $props();
    let hex = $derived(colorToHex6(color))
</script>

<div id="color-picker">
    <div id="previous-colors">
        {#each previouslyPickedColors as c (c)}
            <button title="Previous Color: {c}" class="previous-color" style:background-color={`rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`} onclick={() => color = c}></button>
        {/each}
    </div>
    <input type="color" bind:value={hex} onblur={(e) => {
        const hex = (e.target as HTMLInputElement).value;
        console.log(hex);
        const newColor = hexToColor(hex);
        if (!newColor) return;
        color = { ...color, ...newColor };
        if (!previouslyPickedColors.find(c => c.r === newColor.r && c.g === newColor.g && c.b === newColor.b && c.a === newColor.a)) {
            previouslyPickedColors = [newColor, ...previouslyPickedColors].slice(0, 5);
        }
    }}/>
    <Slider min={0} max={1} step={0.01} bind:value={color.a}/>
</div>

<style>
    #color-picker {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-sm);
    }

    .previous-color {
        width: 20px;
        aspect-ratio: 1 / 1;
        border-radius: var(--r-full);
        border: 1px solid var(--c-txt);
        cursor: pointer;
    }
</style>