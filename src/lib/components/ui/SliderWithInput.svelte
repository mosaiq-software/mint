<script lang="ts">
    import { Input, Slider } from ".";

    interface SliderWithInputProps {
        name: string,
        min?: number,
        max?: number,
        step?: number,
        value: number,
        onSliderChange?: (value: number) => void,
        onSliderBlur?: () => void,
        onInputBlur?: (value: number) => void,
    }

    let {
        name,
        min,
        max,
        step,
        value = $bindable(),
        onSliderChange = (n: number) => {},
        onSliderBlur = () => {},
        onInputBlur = (n: number) => {}
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

<div id="slider-with-input">
    <div id="labels">
        <label for={`slider-input-${name.split(' ')[0]}`}>{name}</label>
        <Input name={name}
               id={`slider-input-${name.split(' ')[0]}`}
               bind:value={stringifiedValue}
               variant="underline"
               style="flex-shrink: 1; flex-grow: 0"
               onBlur={handleInputBlur}
        >
            <div></div>
        </Input>
    </div>
    <Slider min={min} max={max} step={step} bind:value={value}
        onValueChange={onSliderChange}
        onBlur={onSliderBlur}
    />
</div>

<style>
    #labels {
        display: flex;
        justify-content: space-between;
    }
</style>