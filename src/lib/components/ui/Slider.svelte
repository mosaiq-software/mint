<script lang="ts">
    import { Slider, type SliderProps } from "melt/builders";

    interface Props {
        value: number;
        min?: number;
        max?: number;
        step?: number;
    }

    let {
        value = $bindable(),
        min = 0,
        max = 100,
        step = 1,
    }: Props = $props();

    const slider = new Slider({ 
        value, min, max, step,
        orientation: 'horizontal',
        onValueChange: (val) => value = val,
    });
</script>

<div {...slider.root} class="slider">
    <div class="track"></div>
    <div class="range"></div>
    <div {...slider.thumb}></div>
</div>

<style>
    .slider {
        position: relative;
        width: 100%;
        height: 10px;
        display: flex;
        align-items: center;
    }

    .slider .track, .slider .range {
        height: 3px;
        margin: auto 0;
        border-radius: var(--r-full);
    }

    .slider .track {
        width: 100%;
        position: relative;
        background: var(--c-mid);
    }

    .slider .range {
        position: absolute;
        inset: 0;
        right: var(--percentage-inv);
        background: var(--c-acc);
    }

    .slider [data-melt-slider-thumb] {
        position: absolute;
        background: var(--c-txt);
        left: var(--percentage);
        top: 50%;
        transform: translate(-50%, -50%);
        height: 100%;
        aspect-ratio: 1 / 1;
        border-radius: var(--r-full);
    }
</style>