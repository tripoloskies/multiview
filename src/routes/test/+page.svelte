<script>
    import { onMount } from 'svelte';

let { data } = $props()


onMount(() => {
    console.log(data?.x || null)
})
</script>

