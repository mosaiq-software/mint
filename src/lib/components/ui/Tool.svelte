<script lang="ts">
    import {IconButtonVisual} from "./index";
    import {Tooltip} from "melt/builders";

    const tooltip = new Tooltip({
        floatingConfig: {
            computePosition: {
                placement: 'right'
            }
        }
    });
    const {name, children, keybind = null, selected = false} = $props();
</script>

<div {...tooltip.trigger} class="tool">
    <IconButtonVisual label={name} selected={selected}>
        {@render children()}
        <div {...tooltip.content} class="popover">
            <div {...tooltip.arrow}></div>
            <p>{name} {#if (keybind)}<kbd>{keybind}</kbd>{/if}</p>
        </div>
    </IconButtonVisual>
</div>

<style>
    .popover {
        cursor: default;
    }
</style>