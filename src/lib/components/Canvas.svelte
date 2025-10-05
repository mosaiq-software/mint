<script lang="ts">
    import { getSelectedDoc } from "../scripts/docs.svelte";
    import { render } from "../scripts/render";

    let doc = $derived(getSelectedDoc());
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
        if (canvas && doc) {
            console.log("Rendering canvas");
            render(canvas);
        }
    });

    function handleMouseDown(e: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log("Mouse down position:", x, y);
    }

    function handleMouseMove(e: MouseEvent) {
        // determine if mouse is down and drawing

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log("Mouse move position:", x, y);
    }

    function handleMouseUp(e: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log("Mouse up position:", x, y);
    }

    function handleKeyDown(e: KeyboardEvent) {
        // Handle keyboard interactions
        console.log("Key pressed:", e.key);
    }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
    id="scroll-container"
    role="application"
    aria-label="Drawing canvas"
    aria-describedby="canvas-instructions"
    onkeydown={handleKeyDown}
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
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