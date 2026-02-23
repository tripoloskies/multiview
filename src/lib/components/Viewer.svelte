<script>
	import { onDestroy, onMount } from 'svelte';
	import Hls from 'hls.js';
    import { resolve } from '$app/paths';

	/**
	 * @type {MediaElementAudioSourceNode}
	 */
	let source

	const audioContext = new window.AudioContext()

	let { path = '', muted = false, online = false, visible = true, status = "Empty"} = $props();
	/**
	 * @type {import('hls.js').default}
	 */
	let instance = new Hls({
		startFragPrefetch: true,
		initialLiveManifestSize: 3,
	});
	/**
	 * @type {HTMLVideoElement}
	 */
	let player;

	/**
	 * @type {import("hls.js").ErrorTypes | null}
	 */
	let errorType = $state(null)
	let oldSrc = $state("")
	let oldStats = $state(false)
	let oldVisible = $state(true)
	let meterPercent = $state(0)
	let meterLabel = $state(-40)
	let meterColorIndicator = $state("")



	onMount(() => {
		renderView();
	});

	$effect(() => {
		if (!Hls.isSupported()) {
			console.error('This client browser does not support HLS.');
			return;
		}
		const mediaUrl = `http://${window.location.hostname}:8888/${path}/index.m3u8`;
		
		if (oldSrc !== mediaUrl || oldStats !== online) {
			oldSrc = mediaUrl;
			oldStats = online;
			instance.loadSource(`http://${window.location.hostname}:8888/${path}/index.m3u8`);
		}
		
	})


	$effect(() => {
		if (oldVisible !== visible) {
			oldVisible = visible
			if (visible) {
				instance.startLoad()
			}
			else {
				instance.stopLoad()
			}
		} 
	})
	onDestroy(() => {
		destroyView();
	})

	/**
	 * A "Useful" function to stop fetching HLS manifest even the player's instance is not visible to the user.
	 * Reducing network bandwith and CPU/GPU/Media Decoder's usage at a cost of reloading HLS manifest (when trying to switch from singleview to multiview),
	 * resulting in longer delays.
	 */
	async function destroyView() {
		if (!Hls.isSupported()) {
			console.error('This client browser does not support HLS.');
			return;
		}
		instance.detachMedia();
		instance.destroy();
	}
	async function renderView() {
		
		if (!Hls.isSupported()) {
			console.error('This client browser does not support HLS.');
			return;
		}

		if (!path?.length) {
			console.error('Blank path');
			return;
		}

		instance.attachMedia(player);

		instance.on(Hls.Events.ERROR, (event, data) => {
			event // Just leave it here
			if (data.fatal) {
				errorType = data.type
			}
		})

		instance.on(Hls.Events.MANIFEST_PARSED, async () => {
			errorType = null
			await player.play()
			
			if (source) {
				return
			}
			source = audioContext.createMediaElementSource(player);
			let analyser = audioContext.createAnalyser();

			analyser.fftSize = 512; 

			// Connect the chain
			source.connect(analyser);
			analyser.connect(audioContext.destination);

			const bufferLength = analyser.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);

			function update() {
				analyser.getByteFrequencyData(dataArray);

				// Calculate average volume (RMS-like)
				let sum = 0;
				for (let i = 0; i < bufferLength; i++) {
				sum += dataArray[i];
				}
				// 1. Get the average (0 - 255)
				const average = sum / bufferLength;

				// 2. Normalize to a scale of 0 to 1
				const normalized = average / 255;

				// 3. Calculate dB
				// We use -100 as a "floor" so we don't get -Infinity
				let roundedDB = (normalized > 0) ? 20 * Math.log10(normalized) : -40;
				// 3. Calculate dB
				// We use -100 as a "floor" so we don't get -Infinity
				let labelDB = (normalized > 0) ? 20 * Math.log10(normalized) : -90;
				
				meterLabel = Math.round(labelDB)
				meterPercent = (1 -(Math.abs(roundedDB) / 40)) * 100

				if (meterLabel >= -6) {
					meterColorIndicator = "oopsie"
				}
				else if (meterLabel >= -12 && meterLabel <= -7) {
					meterColorIndicator = "warning"
				}
				else {
					meterColorIndicator = "safe"
				}

				setTimeout(() => {
					requestAnimationFrame(update);
				}, 30)
			}
			update();
		});
	}
</script>

<a href={resolve(`/(view)/(singleview)/player/play/[...path]`, { path: path })}>
	<div class="viewer-main">
		<div class="viewer-player-container">
			<div class="viewer-player-notice">
			{#if errorType}
				<!-- {#if errorType == Hls.ErrorTypes.NETWORK_ERROR}
					<b>NO SIGNAL</b>
				{:else if errorType == Hls.ErrorTypes.MEDIA_ERROR}
					<b>INVALID MEDIA</b>
				{:else if errorType == Hls.ErrorTypes.MUX_ERROR}
					<b>INVALID MEDIA</b>
				{:else}
					<b>TD</b>
				{/if} -->
				<b>{status}</b>
			{:else}
				<b>Online</b>
			{/if}
			</div>

			<video class={!visible ? "hidden" : ""} bind:this={player} {muted}></video>
		</div>
		<span class="player-info">
			<b>{path}</b>
		</span>
	</div>
	{#if !muted}
	<div class="audio-meter">
		<div class={`audio-meter-content ${meterColorIndicator}`} style={`height:${meterPercent}%`}>
			<div class="audio-meter-label">
				{meterLabel <= -90 ? "NA" : meterLabel}
			</div>
		</div>
	</div>
	{/if}
</a>

<style lang="postcss">
	@reference "tailwindcss";
	a {
		@apply flex flex-1 h-full w-full ;
	}
	.viewer-player-notice > * {
		@apply bg-white text-black p-2;
	}
	.viewer-player-container {
		@apply flex justify-center items-center flex-1 relative w-full h-full;
	}
	.player-info {
		@apply block bg-neutral-800 text-white px-4 py-2 w-full;
	}
	.viewer-main {
		@apply flex-1 flex items-center justify-between relative flex-col;
	}

	video {
		@apply absolute h-full w-full top-0 left-0 object-contain;
	}

	.audio-meter {
		@apply bg-neutral-700 rotate-180 w-6;
	}

	.audio-meter-label {
		@apply rotate-180 text-white;	
	}
	.audio-meter-content.safe {
		@apply bg-blue-500;
	}
	.audio-meter-content.warning {
		@apply bg-orange-500;
	}
	.audio-meter-content.oopsie {
		@apply bg-red-500;
	}
</style>


