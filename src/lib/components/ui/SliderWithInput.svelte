<script lang="ts">
    import { Input, Slider } from ".";

    interface SliderWithInputProps {
        name: string;
        min?: number;
        max?: number;
        step?: number;
        value: number;
        onSliderChange?: (value: number) => void;
        onSliderBlur?: () => void;
        onInputBlur?: (value: number) => void;
        disabled?: boolean;
    }

    let {
        name,
        min,
        max,
        step,
        value = $bindable(),
        onSliderChange = (n: number) => {},
        onSliderBlur = () => {},
        onInputBlur = (n: number) => {},
        disabled = false,
    }: SliderWithInputProps = $props();

    let stringifiedValue = $derived(value.toFixed(2));

    function handleInputBlur() {
        const parsedValue = parseFloat(stringifiedValue);
        const invalid = isNaN(parsedValue);
        if (!invalid) {
            value = parsedValue;
            onInputBlur(parsedValue);
        }
        stringifiedValue = value.toFixed(2);
    }
</script>

<div id="slider-with-input" class:disabled>
    <Input
        {name}
        bind:value={stringifiedValue}
        variant="underline"
        style="width: 3rem; margin-left: auto"
        onblur={handleInputBlur}
        labelPosition="side"
    >
        {name}
    </Input>
    <Slider
        {min}
        {max}
        {step}
        bind:value
        onValueChange={onSliderChange}
        onBlur={onSliderBlur}
    />
</div>

<style>
    .disabled {
        opacity: 0.5;
        pointer-events: none;
    }
</style>
