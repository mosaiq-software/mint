<script lang="ts">
    import Input from '../ui/Input.svelte';
    import { getSelectedDoc } from "../../scripts/docs.svelte";

    const doc = $derived(getSelectedDoc());

    let widthStr: string = $derived(doc ? doc.width.toString() : '');
    let heightStr: string = $derived(doc ? doc.height.toString() : '');

    function handleCanvasSizeBlur(type: 'width' | 'height', dimStr: string) {
        let doc = getSelectedDoc();
        if (!doc) return dimStr;

        let dim = parseInt(dimStr);
        if (isNaN(dim) || dim <= 0) {
            return `${doc[type]}`;
        } else {
            doc[type] = dim;
            return dimStr;
        }
    }
</script>

<Input
    type="number"
    name="canvas-width"
    placeholder="Width"
    bind:value={widthStr}
    onBlur={() => {
        widthStr = handleCanvasSizeBlur('width', widthStr)
    }}
>Width</Input>

<Input
    type="number"
    name="canvas-height"
    placeholder="Height"
    bind:value={heightStr}
    onBlur={() => {
        heightStr = handleCanvasSizeBlur('height', heightStr)
    }}
>Height</Input>