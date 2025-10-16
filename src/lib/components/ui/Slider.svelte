<script lang="ts">
    import { Slider } from "melt/builders";

    interface Props {
        value?: number;
        min?: number;
        max?: number;
        step?: number;
        onValueChange?: (value: number) => void;
        onBlur?: () => void;
    }

    let {
        value = $bindable(),
        min = 0,
        max = 100,
        step = 1,
        onValueChange = () => {},
        onBlur = () => {}
    }: Props = $props();

    const slider = new Slider({ 
        value, min, max, step,
        orientation: 'horizontal',
        onValueChange: (val) => {
            if (value !== undefined) { value = val; onValueChange(val); }
        },
    });

    $effect(() => {
        if (value !== undefined && slider.value !== value) slider.value = value;
    });

    let pointerUpHandler: ((e: PointerEvent) => void) | null = null;

    function handleFocus() {
        pointerUpHandler = (e) => {
            document.getElementById(slider.thumb.id)?.blur();
        };
        document.addEventListener('pointerup', pointerUpHandler);
    }

    function handleBlur() {
        if (pointerUpHandler) {
            document.removeEventListener('pointerup', pointerUpHandler);
            pointerUpHandler = null;
        }
        onBlur();
    }
</script>

<div {...slider.root} class="slider">
    <div class="track"></div>
    <div class="range"></div>
    <div {...slider.thumb} onfocus={handleFocus} onblur={handleBlur}></div>
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