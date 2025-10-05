<script lang="ts">
    import { getSelectedDoc } from "../scripts/docs.svelte";
    import ui from "../scripts/ui.svelte";
    import { render } from "../scripts/render";
    import { tools } from "../scripts/tools";

    let doc = $derived(getSelectedDoc());
    let tool = $derived(tools[ui.mode]);
    let canvas: HTMLCanvasElement;
    
    $effect(() => {
        if (canvas && doc) {
            canvas.width = doc.width;
            canvas.height = doc.height;

            canvas.style.width = doc.width + 'px';
            canvas.style.height = doc.height + 'px';
        }
    });

    $effect(() => {
        if (canvas && doc) render(canvas);
    });

    function handlePointerDown(e: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const layer = ui.selectedLayers[ui.selectedDocument!]?.[0] || null;

        tool.onPointerDown?.({ c: p, l: layer ? p : null, e });
    }

function handlePointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const layer = ui.selectedLayers[ui.selectedDocument!]?.[0] || null;

    // Get coalesced events for even smoother strokes
    const events = e.getCoalescedEvents();
    if (events.length > 0) {
        for (const event of events) {
            const coalescedP = { 
                x: event.clientX - rect.left, 
                y: event.clientY - rect.top 
            };
            tool.onPointerMove?.({ c: coalescedP, l: layer ? coalescedP : null, e: event });
        }
    } else {
        tool.onPointerMove?.({ c: p, l: layer ? p : null, e });
    }
}

    function handlePointerUp(e: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const layer = ui.selectedLayers[ui.selectedDocument!]?.[0] || null;

        tool.onPointerUp?.({ c: p, l: layer ? p : null, e });
    }

    function handleKeyDown(e: KeyboardEvent) {
        tool.onKeyDown?.(e);
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    id="scroll-container"
    role="application"
    aria-label="Drawing canvas"
    aria-describedby="canvas-instructions"
    onkeydown={handleKeyDown}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
>
    <div id="canvas-container">
        <canvas bind:this={canvas} aria-hidden="true"></canvas>
        <div id="canvas-instructions" class="sr-only">
            Interactive drawing canvas. Click and drag to draw. Use keyboard shortcuts for additional tools.
        </div>
    </div>
</div>

<style>
    #scroll-container {
        height: 100%;
        flex: 1;
        overflow: auto;
    }

    #canvas-container {
        margin: var(--s-xl);
        width: fit-content;
        height: fit-content;
        background-image: url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='10' height='10' fill='%23ccc'/%3e%3crect x='10' y='10' width='10' height='10' fill='%23ccc'/%3e%3c/svg%3e");
        background-color: #fff;
    }
</style>