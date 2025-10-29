<script lang="ts">
    import docs from "../scripts/docs.svelte";
    import ui from "../scripts/ui.svelte";
    import { render } from "../scripts/render";
    import { select, text, tools, type Point } from "../scripts/tools";
    import { draw } from "../scripts/tools";
    import Transform from "./overlays/Transform.svelte";
    import TextMeasure from "./overlays/TextMeasure.svelte";
    import TextEdit from "./overlays/TextEdit.svelte";
    import type { ScaleDirection } from "../scripts/tools/select.svelte";
    import { handleImageDrop } from "../scripts/importImage";
    import DropMargin from "./overlays/DropMargin.svelte";
    import { handleShortcuts } from "../scripts/shortcut";
;
    let tool = $derived(tools[ui.mode]);
    let canvas: HTMLCanvasElement;
    let scrollContainer: HTMLDivElement;
    let pointerPosition = $state({ x: 0, y: 0 });
    let selectedLayer = $derived.by(() => {
        if (!docs.selected || !ui.selected) return null;
        const layerId = ui.selected.selectedLayers[0];
        return docs.selected.layers.find(l => l.id === layerId) || null;
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
        } else if (tool.name === 'text') {
            if (text.action === 'resize') {
                return 'nwse-resize';
            } else if (text.action === 'edit') {
                return 'text';
            } else {
                return 'default';
            }
        } else {
            return 'default';
        }
    });
    
    $effect(() => {
        if (canvas && docs.selected) {
            canvas.width = docs.selected.width;
            canvas.height = docs.selected.height;

            canvas.style.width = docs.selected.width + 'px';
            canvas.style.height = docs.selected.height + 'px';
        }
    });

    $effect(() => {
        if (canvas && docs.selected) render(canvas, docs.selected);
    });

    $effect(() => {
        if (scrollContainer && ui.selected) {
            scrollContainer.scrollLeft = ui.selected.pan.x;
            scrollContainer.scrollTop = ui.selected.pan.y;
        }
    });

    function getViewportPoint(e: PointerEvent): Point {
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function getCanvasPoint(v: Point): Point {
        if (!docs.selected || !ui.selected) return v;
        const zoom = ui.selected.zoom;
        return { x: v.x / zoom, y: v.y / zoom };
    }

    function getLayerSpacePoint(c: Point, layerId: string): Point | null {
        if (!docs.selected) return null;
        const layer = docs.selected.layers.find(l => l.id === layerId);
        if (!layer) return null;
        
        const invMatrix = layer.transform.matrix.inverse();
        const point = new DOMPoint(c.x, c.y).matrixTransform(invMatrix);
        return { x: point.x, y: point.y };
    }

    function handlePointerDown(e: PointerEvent) {
        const v = getViewportPoint(e);
        const c = getCanvasPoint(v);
        const l = selectedLayer ? getLayerSpacePoint(c, selectedLayer.id) : null;

        tool.onPointerDown?.({ v, c, l, e });
    }

    function handlePointerMove(e: PointerEvent) {
        const v = getViewportPoint(e);
        const c = getCanvasPoint(v);
        const l = selectedLayer ? getLayerSpacePoint(c, selectedLayer.id) : null;

        // // handle multiple move events per frame
        // const events = e.getCoalescedEvents();
        // if (events.length > 0) {
        //     for (const event of events) {
        //         const coalescedP = { 
        //             x: event.clientX - rect.left, 
        //             y: event.clientY - rect.top 
        //         };
        //         const coalescedL = layer ? getLayerSpacePoint(coalescedP, layer) : null;
        //         tool.onPointerMove?.({ c: coalescedP, l: coalescedL, e: event });
        //     }
        // } else {
        //     tool.onPointerMove?.({ c: p, l, e });
        // }

        tool.onPointerMove?.({ v, c, l, e });
        pointerPosition = c;
    }

    function handlePointerUp(e: PointerEvent) {
        const v = getViewportPoint(e);
        const c = getCanvasPoint(v);
        const l = selectedLayer ? getLayerSpacePoint(c, selectedLayer.id) : null;

        tool.onPointerUp?.({ v, c, l, e });
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.target && (e.target as HTMLElement).tagName !== 'INPUT') {
            tool.onKeyDown?.(e);
            handleShortcuts(e);
        }
    }

    let dragOver = $state(false);
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

    function handleImageDropLocal(e: DragEvent) {
        entryCount = 0;
        dragOver = false;
        const margin = e.target && (e.target as HTMLElement).closest('.drop-margin');
        if (margin) {
            const side = margin.classList.item(1) || undefined;
            handleImageDrop(e, side);
        } else {
            handleImageDrop(e);
        }
    }

    function handleScroll() {
        if (ui.selected && scrollContainer) {
            ui.selected.pan = {
                x: scrollContainer.scrollLeft,
                y: scrollContainer.scrollTop
            };
        }
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    id="scroll-container"
    role="application"
    aria-label="Drawing canvas"
    aria-describedby="canvas-instructions"
    style="cursor: {cursor};"
    bind:this={scrollContainer}
    onkeydown={handleKeyDown}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    onscroll={handleScroll}
>
    <div id="interactive-area"
        role="application"
        ondragover={(e) => e.preventDefault()}
        ondrop={handleImageDropLocal}
        style:width={docs.selected && ui.selected ? docs.selected.width * ui.selected.zoom + 'px' : '800px'}
        style:height={docs.selected && ui.selected ? docs.selected.height * ui.selected.zoom + 'px' : '600px'}
    >
        <div
            id="canvas-area"
            style:width={docs.selected ? docs.selected.width + 'px' : '800px'}
            style:height={docs.selected ? docs.selected.height + 'px' : '600px'}
        >
            <canvas
                bind:this={canvas}
                aria-hidden="true"
                style:transform={ui.selected ? `scale(${ui.selected.zoom})` : 'scale(1)'}
            ></canvas>
            <div id="canvas-instructions" class="sr-only">
                Interactive drawing canvas. Click and drag to draw. Use keyboard shortcuts for additional tools.
            </div>
            <div id="overlay-area">
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
                {#if dragOver}
                    <DropMargin side="left" />
                    <DropMargin side="top" />
                    <DropMargin side="bottom" />
                    <DropMargin side="right" />
                {/if}
                {#if tool.name === 'select' && selectedLayer}
                    <Transform layer={selectedLayer} />
                {/if}
                {#if tool.name === 'text' && selectedLayer?.type === 'text'}
                    <TextEdit bind:layer={selectedLayer} />
                {/if}
            </div>
        </div>
    </div>
    <TextMeasure />
</div>

<svelte:window onkeydown={handleKeyDown} />

<style>
    #scroll-container {
        height: 100%;
        flex: 1;
        overflow: auto;
        position: relative;
    }

    #interactive-area {
        margin: var(--s-xl);
    }

    #canvas-area {
        position: relative;
    }

    #overlay-area {
        position: absolute;
        inset: 0;
    }

    canvas {
        background-image: url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='10' height='10' fill='%23ccc'/%3e%3crect x='10' y='10' width='10' height='10' fill='%23ccc'/%3e%3c/svg%3e");
        background-color: #fff;
        position: relative;
        transform-origin: top left;
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