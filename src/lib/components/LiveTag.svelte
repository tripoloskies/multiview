<script>
	let { name, status = false } = $props();
</script>

<div class="livetag-container">
	<div>
		<b class="livetag-name">{name}</b>
	</div>
	<div>
		<b class="livetag-status">{status ? 'Online' : 'Offline'}</b>
	</div>
</div>

<style lang="postcss">
	.livetag-container {
		@apply flex;
	}
	.livetag-container > *:first-child {
		@apply grow;
	}
	.livetag-name {
	}
	.livetag-status {
	}
</style>
