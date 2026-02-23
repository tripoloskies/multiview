<script>
	import { onDestroy, onMount } from 'svelte';
	import Hls from 'hls.js';
    import { resolve } from '$app/paths';
    import { goto } from '$app/navigation';

	/**
	 * @type {MediaElementAudioSourceNode}
	 */
	let source;


	/**
	 * @type {AudioContext}
	 */
	let audioContext;

	let { path = '', muted = true, online = false, visible = true, status = "Empty"} = $props();
	/**
	 * @type {import('hls.js').default}
	 */
	let instance = $state(new Hls({
		startFragPrefetch: true,
		maxLiveSyncPlaybackRate: 1.5,
	}));
	/**
	 * @type {HTMLVideoElement}
	 */
	let player;

	/**
	 * @type {import("hls.js").ErrorTypes | null}
	 */
	let errorType = $state(null)
	let oldVisible = $state(false)
	let oldSource = $state("")
	let isReady = $state(false)
	let meterPercent = $state(0)
	let meterLabel = $state(-40)
	let meterColorIndicator = $state("")


	onMount(() => {
		player.muted = true;
		renderView();
	});

	$effect(() => {
		if (online) {
			const newSource = `http://${window.location.hostname}:8888/${path}/index.m3u8`;
			if (oldSource !== newSource) {
				oldSource = newSource;
				instance.loadSource(newSource);
				return;
			}
		}
		else {
			instance.stopLoad();
			oldSource = "";
			instance.loadSource("");
		}
		if (oldVisible !== visible) {
			oldVisible = visible;
			
			if (!online) return;

			if (visible) instance.startLoad()
			else instance.stopLoad()
		}

	})
	onDestroy(() => {
		destroyView();
	})

	async function loadMeter() {

		if (audioContext) {
			if (audioContext.state === "closed") {
				await audioContext.resume()
			}
			return
		}


		audioContext = new window.AudioContext()
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
			const roundedDB = (normalized > 0) ? 20 * Math.log10(normalized) : -100;
			// 3. Calculate dB
			// We use -100 as a "floor" so we don't get -Infinity
			const labelDB = (normalized > 0) ? 20 * Math.log10(normalized) : -100;
			
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
	}
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

		if (audioContext) {
			await audioContext.close()
		}
		
		instance.destroy()
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

		player.onplay = () => {
			if (!instance.liveSyncPosition) {
				return;
			}
			player.currentTime = instance.liveSyncPosition;
		}

		instance.on(Hls.Events.ERROR, (event, data) => {
			event // Just leave it here
			if (data.fatal) {
				errorType = data.type
			}
		})
		instance.on(Hls.Events.MANIFEST_LOADED, () => {
			errorType = null;
			isReady = true;
		});

		if (instance.media) {
			return
		}
		instance.attachMedia(player);
	}
</script>

<button onclick={async (e) => {
	if (muted) {
		await goto(resolve(`/(view)/(singleview)/player/play/[...path]`, { path: path }))
		return
	}
	if (!muted && isReady && player.muted) {
		player.muted = false;
		loadMeter()
	}
}}>
	<div class="viewer-main">
		<div class="viewer-player-container">
			<div class="viewer-player-notice">
			{#if errorType}
				<b>{status}</b>
			{:else}
				<b>Online</b>
			{/if}
			</div>

			<video class={!visible ? "hidden" : ""} bind:this={player} autoplay>
				<b>Dog</b>
			</video>
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
</button>

<style lang="postcss">
	@reference "tailwindcss";
	button {
		@apply flex flex-1 h-full w-full cursor-pointer;
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


