<script lang="ts">
    import docs, { getSelectedDoc } from "../state/docs.svelte";
    import ui from "../state/ui.svelte";

    let doc = $derived(getSelectedDoc());
    let canvas: HTMLCanvasElement;
    
    $effect(() => {
        if (canvas) {
            console.log("Resizing canvas to:", doc.width, doc.height);
            canvas.width = doc.width;
            canvas.height = doc.height;

            canvas.style.width = doc.width + 'px';
            canvas.style.height = doc.height + 'px';
        }
    });
</script>

<div id="canvas-container">
    <canvas bind:this={canvas}></canvas>
</div>

<style>
    #canvas-container {
        margin: var(--s-xl);
        width: fit-content;
        height: fit-content;
        background-image: url("data:image/svg+xml,%3csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='10' height='10' fill='%23ccc'/%3e%3crect x='10' y='10' width='10' height='10' fill='%23ccc'/%3e%3c/svg%3e");
        background-color: #fff;
    }
</style>