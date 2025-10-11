<script lang="ts">
    import {ChevronLeft, ChevronUp, ChevronDown, ChevronRight} from "@lucide/svelte";

    interface DropMarginProps {
        side: "top" | "bottom" | "left" | "right"
    }
    const { side }: DropMarginProps = $props();
    const position = {
        left: `top: 0; right: 100%`,
        top: `left: 0; bottom: 100%`,
        right: `top: 0; left: 100%`,
        bottom: `left: 0; top: 100%`
    }[side];
    const borderRadiusSize = 'var(--s-lg)';
    const borderRadius = {
        left: `border-top-left-radius: ${borderRadiusSize}; border-bottom-left-radius: ${borderRadiusSize}`,
        top: `border-top-left-radius: ${borderRadiusSize}; border-top-right-radius: ${borderRadiusSize}`,
        right: `border-top-right-radius: ${borderRadiusSize}; border-bottom-right-radius: ${borderRadiusSize}`,
        bottom: `border-bottom-left-radius: ${borderRadiusSize}; border-bottom-right-radius: ${borderRadiusSize}`,
    }[side];
    const marginSize = 'var(--s-xl)';
    const sizing = (side === 'top' || side === 'bottom')
        ? `width: 100%; height: ${marginSize}`
        : `height: 100%; width: ${marginSize}`;

    let dragOver = $state(false);
    let dragStyles = $derived.by(() => {
        if (!dragOver) {
            return `background: transparent`;
        } else {
            return `background: var(--c-acc)`;
        }
    });

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
    class="drop-margin"
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
        border: 1px solid var(--c-txt);
    }

    .dropmargin-chevron {
        pointer-events: none;
    }
</style>