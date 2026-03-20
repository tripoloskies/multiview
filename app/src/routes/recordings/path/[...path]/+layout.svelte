<script lang="ts">
	const { data, children } = $props();

	let isPathOnlineClass: string = $state('');

	$effect(() => {
		switch (data.pathInfo.liveStatus.toLowerCase()) {
			case 'online':
				isPathOnlineClass = 'Online';
				break;
			case 'offline':
			case 'no signal':
				isPathOnlineClass = 'Offline';
				break;
			default:
				isPathOnlineClass = 'Unknown';
		}
	});
</script>

<div id="path-header">
	<span id="live-status-label">
		<h1>{data.pathInfo.name}</h1>
		<b id="live-status-badge" class={isPathOnlineClass.toLowerCase()}
			>{isPathOnlineClass.toUpperCase()}</b
		>
	</span>
	<div id="path-header-description">
		<h3>Statistics</h3>
		<p>Live Status: {data.pathInfo.liveStatus}</p>
		<p>Videos: {data.pathInfo.videoCount}</p>
	</div>
</div>
<div>
	{@render children()}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	#path-header {
		@apply space-y-4 bg-neutral-800 p-2;
	}
	span {
		@apply flex items-center space-x-2;
	}

	#live-status-badge {
		@apply bg-yellow-600 p-2 text-white;
	}

	#live-status-badge.offline {
		@apply bg-red-600;
	}

	#live-status-badge.online {
		@apply bg-green-600;
	}
</style>
