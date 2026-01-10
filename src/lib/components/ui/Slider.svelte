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
        onBlur = () => {},
    }: Props = $props();

    /** Make sure the value reflected by the slider doesn't exceed its bounds */
    const clampedValue = $derived(
        value === undefined ? min : Math.min(Math.max(value, min), max),
    );

    const slider = new Slider({
        min,
        max,
        step,
        value: () => clampedValue,
        orientation: "horizontal",
        onValueChange: (val) => {
            if (value !== undefined) {
                value = val;
                onValueChange(val);
            }
        },
    });

    let pointerUpHandler: ((e: PointerEvent) => void) | null = null;

    /** Handle focus on the slider thumb to track pointer up events. */
    function handleFocus() {
        pointerUpHandler = (e) => {
            document.getElementById(slider.thumb.id)?.blur();
        };
        document.addEventListener("pointerup", pointerUpHandler);
    }

    /** Handle blur on the slider thumb to clean up event listeners. */
    function handleBlur() {
        if (pointerUpHandler) {
            document.removeEventListener("pointerup", pointerUpHandler);
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

    .slider .track,
    .slider .range {
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
