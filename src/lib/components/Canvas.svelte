<script lang="ts">
    import { getSelectedDoc } from "../scripts/docs.svelte";
    import ui from "../scripts/ui.svelte";
    import { render } from "../scripts/render";
    import { select, tools, type Point } from "../scripts/tools";
    import { draw } from "../scripts/tools";
    import Transform from "./overlays/Transform.svelte";
    import type { ScaleDirection } from "../scripts/tools/select.svelte";

    let doc = $derived(getSelectedDoc());
    let tool = $derived(tools[ui.mode]);
    let canvas: HTMLCanvasElement;
    let pointerPosition = $state({ x: 0, y: 0 });
    const selectedLayer = $derived.by(() => {
        if (!doc) return null;
        const layerId = ui.selectedLayers[doc.id]?.[0];
        return doc.layers.find(l => l.id === layerId) || null;
    });

    const cursorMap: Record<ScaleDirection, string> = {
        n: 'ns-resize',
        s: 'ns-resize',
        e: 'ew-resize',
        w: 'ew-resize',
        ne: 'nesw-resize',
        sw: 'nesw-resize',
        nw: 'nwse-resize',
        se: 'nwse-resize',
    };

    const cursor = $derived.by(() => {
        if (tool.name === 'draw' || tool.name === 'erase') {
            return 'crosshair';
        } else if (tool.name === 'select') {
            if (select.action.type === 'move') {
                return 'move';
            } else if (select.action.type === 'scale') {
                return cursorMap[select.action.direction];
            } else if (select.action.type === 'rotate') {
                if (select.dragging) {
                    return 'grabbing';
                } else {
                    return 'grab';
                }
            } else {
                return 'default';
            }
        } else {
            return 'default';
        }
    });
    
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

    function getLayerSpacePoint(c: Point, layerId: string): Point | null {
        if (!doc) return null;
        const layer = doc.layers.find(l => l.id === layerId);
        if (!layer) return null;
        
        const invMatrix = layer.transform.matrix.inverse();
        const point = new DOMPoint(c.x, c.y).matrixTransform(invMatrix);
        return { x: point.x, y: point.y };
    }

    function handlePointerDown(e: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        let layer = ui.selectedLayers[ui.selectedDocument!]?.[0] || null;
        let l = layer ? getLayerSpacePoint(p, layer) : null;

        tool.onPointerDown?.({ c: p, l, e });
    }

    function handlePointerMove(e: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const layer = ui.selectedLayers[ui.selectedDocument!]?.[0] || null;
        let l = layer ? getLayerSpacePoint(p, layer) : null;

        // Get coalesced events for even smoother strokes
        const events = e.getCoalescedEvents();
        if (events.length > 0) {
            for (const event of events) {
                const coalescedP = { 
                    x: event.clientX - rect.left, 
                    y: event.clientY - rect.top 
                };
                const coalescedL = layer ? getLayerSpacePoint(coalescedP, layer) : null;
                tool.onPointerMove?.({ c: coalescedP, l: coalescedL, e: event });
            }
        } else {
            tool.onPointerMove?.({ c: p, l, e });
        }

        pointerPosition = p;
    }

    function handlePointerUp(e: PointerEvent) {
        const rect = canvas.getBoundingClientRect();
        const p = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const layer = ui.selectedLayers[ui.selectedDocument!]?.[0] || null;
        let l = layer ? getLayerSpacePoint(p, layer) : null;

        tool.onPointerUp?.({ c: p, l, e });
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
    style="cursor: {cursor};"
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
        {#if tool.name === 'draw'}
            <div
                id="draw-cursor"
                style={`
                    width: ${draw.brushSize}px;
                    height: ${draw.brushSize}px;
                    left: ${pointerPosition.x}px;
                    top: ${pointerPosition.y}px;
                `}
            ></div>
        {/if}
    </div>
    {#if tool.name === 'select' && selectedLayer}
        <Transform layer={selectedLayer} />
    {/if}
</div>

<style>
    #scroll-container {
        height: 100%;
        flex: 1;
        overflow: auto;
        position: relative;
    }

    #canvas-container {
        margin: var(--s-xl);
        width: fit-content;
        height: fit-content;
        background-image: url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='10' height='10' fill='%23ccc'/%3e%3crect x='10' y='10' width='10' height='10' fill='%23ccc'/%3e%3c/svg%3e");
        background-color: #fff;
        overflow: hidden;
        position: relative;
    }

    #draw-cursor {
        position: absolute;
        pointer-events: none;
        border: 1px solid var(--c-sec);
        border-radius: var(--r-full);
        transform: translate(
            calc(-50%),
            calc(-50%)
        );
    }
</style>