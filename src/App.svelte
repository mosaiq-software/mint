<script lang="ts">
    import Header from "./lib/components/Header.svelte";
    import LeftSidebar from "./lib/components/LeftSidebar.svelte";
    import RightSidebar from "./lib/components/RightSidebar.svelte";
    import Viewport from "./lib/components/Viewport.svelte";

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        if (!e.dataTransfer) return;
        e.dataTransfer.effectAllowed = "none";
        e.dataTransfer.dropEffect = "none";
    }
</script>

<main ondragover={(e) => e.preventDefault()} ondrop={handleDrop}>
    <Header />
    <div id="center">
        <LeftSidebar />
        <Viewport />
        <RightSidebar />
    </div>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    #center {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 0;
        flex: 1;
    }
</style>
