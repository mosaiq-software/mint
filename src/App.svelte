<script lang="ts">
    import Header from "./lib/components/Header.svelte";
    import Footer from "./lib/components/Footer.svelte";
    import LeftSidebar from "./lib/components/LeftSidebar.svelte";
    import RightSidebar from "./lib/components/RightSidebar.svelte";
    import Viewport from "./lib/components/Viewport.svelte";
    import tabStatus from "./lib/scripts/tabStatus.svelte";

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        if (!e.dataTransfer) return;
        e.dataTransfer.effectAllowed = "none";
        e.dataTransfer.dropEffect = "none";
    }

    /**
     * Warn the user if they have any unsaved changes.
     * @param event
     */
    function handleBeforeUnload(event: BeforeUnloadEvent) {
        if (!Object.values(tabStatus).every(t => t.actionsSinceSave === 0)) {
            event.preventDefault();
            event.returnValue = "Are you sure you want to leave? You may have unsaved changes.";
        }
    }
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />
<main ondragover={(e) => e.preventDefault()} ondrop={handleDrop}>
    <div id="upper">
        <LeftSidebar />
        <div id="middle">
            <Header />
            <div id="viewport-wrapper">
                <Viewport />
            </div>
        </div>
        <RightSidebar />
    </div>
    <Footer />
</main>

<style>
    #upper {
        display: flex;
        width: 100%;
        min-height: 0;
        flex-grow: 1;
    }

    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    #middle {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        height: 100%;
    }

    #viewport-wrapper {
        flex-grow: 1;
        min-height: 0;
    }
</style>
