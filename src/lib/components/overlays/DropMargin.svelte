<script lang="ts">
    import { ChevronLeft, ChevronUp, ChevronDown, ChevronRight } from "@lucide/svelte";

    interface DropMarginProps {
        side: "top" | "bottom" | "left" | "right"
    }
    const { side }: DropMarginProps = $props();

    /**
     * State is rarely used in this component, since most values do not
     * change after initialization. However, dragOver is stateful since
     * it changes when a draggable item is over the margin.
     */

    const position = {
        left: `top: -1px; right: 100%`,
        top: `left: -1px; bottom: 100%`,
        right: `top: -1px; left: 100%`,
        bottom: `left: -1px; top: 100%`
    }[side];

    const borderRadiusSize = 'var(--s-lg)';

    const borderRadius = {
        left: `border-top-left-radius: ${borderRadiusSize}; border-bottom-left-radius: ${borderRadiusSize}`,
        top: `border-top-left-radius: ${borderRadiusSize}; border-top-right-radius: ${borderRadiusSize}`,
        right: `border-top-right-radius: ${borderRadiusSize}; border-bottom-right-radius: ${borderRadiusSize}`,
        bottom: `border-bottom-left-radius: ${borderRadiusSize}; border-bottom-right-radius: ${borderRadiusSize}`,
    }[side];

    const marginSize = 'calc(var(--s-xl) - var(--s-sm))';

    const sizing = (side === 'top' || side === 'bottom')
        ? `width: calc(100% + 2px); height: ${marginSize}`
        : `height: calc(100% + 2px); width: ${marginSize}`;

    let dragOver = $state(false);

    let dragStyles = $derived.by(() => {
        if (!dragOver) {
            return `background: transparent`;
        } else {
            return `background: var(--c-acc)`;
        }
    });

    /**
     * Count of dragenter events minus dragleave events.
     * Necessary since dragenter/dragleave events bubble.
     */
    let entryCount = $state(0);

    function handleDragEnter() {
        entryCount++;
        dragOver = true;
    }

    function handleDragLeave() {
        entryCount--;
        if (entryCount === 0) {
            dragOver = false;
        }
    }

    function handleDrop(e: DragEvent) {
        dragOver = false;
        entryCount = 0;
        e.preventDefault();
    }
</script>

<div
    class="drop-margin {side}"
    style="{position}; {sizing}; {borderRadius}; {dragStyles}"
    role="application"
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondragover={(e) => e.preventDefault()}
    ondrop={handleDrop}
>
    {#if side === 'left'}
        <ChevronLeft class="dropmargin-chevron" />
    {:else if side === 'top'}
        <ChevronUp class="dropmargin-chevron" />
    {:else if side === 'right'}
        <ChevronRight class="dropmargin-chevron" />
    {:else}
        <ChevronDown class="dropmargin-chevron" />
    {/if}
</div>

<style>
    .drop-margin {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--c-mid);
    }

    .dropmargin-chevron {
        pointer-events: none;
    }
</style>