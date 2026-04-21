<script lang="ts">
	import Container from '$lib/components/Container.svelte';
	import Prompt from '$lib/components/Prompt.svelte';
	import Subcontainer from '$lib/components/Subcontainer.svelte';
	import { resolve } from '$app/paths';
	import Button from '$lib/components/Button.svelte';
</script>

<Container>
	<Subcontainer front={true}>
		<Prompt returnUrl={resolve('/(view)/(multiview)')}>
			{#snippet header()}
				<h2>About</h2>
			{/snippet}
			<div class="flex flex-col items-center space-y-2">
				<h2>Multiview</h2>
				<b>Version 0.0.6-alpha</b>
				<p>The source code is licensed under GNU AGPLv3.</p>
				<div class="flex space-x-2">
					<Button
						type="link"
						link="https://www.gnu.org/licenses/agpl-3.0.en.html"
						>View License</Button
					>
					<Button type="link" link="https://github.com/tripoloskies/multiview"
						>Source Code</Button
					>
				</div>
			</div>
		</Prompt>
	</Subcontainer>
</Container>
