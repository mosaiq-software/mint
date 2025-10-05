<script lang="ts">
    import Header from "./lib/components/Header.svelte";
    import LeftSidebar from "./lib/components/LeftSidebar.svelte";
    import Viewport from "./lib/components/Viewport.svelte";
</script>

<main>
    <LeftSidebar />
    <div id="center">
        <Header />
        <Viewport />
    </div>
</main>

<style>
    main {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
    }

    #center {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 0;
        flex: 1;
    }
</style>
