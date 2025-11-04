<script lang="ts">
    interface Props {
        checked: boolean;
        onChange: () => void;
    }

    let {checked = $bindable(), onChange}: Props = $props();
</script>

<input type="checkbox" bind:checked={checked} onchange={onChange}>

<style>
    input {
        width: var(--s-lg);
        height: var(--s-lg);
    }

    input:checked {
        accent-color: var(--c-acc);
    }
</style>