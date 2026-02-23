<script>
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
    import { change, config } from '$lib/stores/config.svelte';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Settings - Multiview</title>
</svelte:head>
<Container full={true}>
	<Subcontainer front={true}>
		<Prompt returnUrl={resolve("/(view)/(multiview)")}>
			{#snippet header()}
				<h2>Settings</h2>
			{/snippet}
			<div id="form">
                <div class="form-group">
                    <label for="showVideoMultiView">Show Video</label>
                    <input type="checkbox" checked={config.showVideoMultiView} name="showVideoMultiView" onclick={(event) => {
						if (!(event.target instanceof HTMLInputElement)) {
							return
						}
                        change("showVideoMultiView", Number(event.target.checked))
                    }}>
                </div>
            </div>
			<hr />
		</Prompt>
	</Subcontainer>
</Container>

<style lang="postcss">
	@reference "tailwindcss";

	#form {
		@apply flex justify-between space-x-4;
	}

    .form-group {
        @apply space-x-4;
    }

</style>
