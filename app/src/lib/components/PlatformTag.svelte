<script lang="ts">
	let { path } = $props();
	let iconTag: string = $state('others');
	let pathName: string = $state('');

	$effect(() => {
		execute();
	});

	function execute() {
		let currentPath: string = path;
		let slicedPath = currentPath.split('/');
		let platformName: string = slicedPath[0];
		if (!slicedPath.length || !platformName.length) {
			return;
		}

		iconTag = platformName.toLowerCase();
		if (slicedPath.length > 1) {
			slicedPath.shift();
		}
		pathName = slicedPath.join('/');
	}

	execute();
</script>

<span class="platform-tag">
	{#if iconTag === 'yt'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 16 16"
		>
			<path
				d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.01 2.01 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.01 2.01 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31 31 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.01 2.01 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A100 100 0 0 1 7.858 2zM6.4 5.209v4.818l4.157-2.408z"
			/>
		</svg>
	{:else if iconTag === 'twitch'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 16 16"
		>
			<path
				d="M3.857 0 1 2.857v10.286h3.429V16l2.857-2.857H9.57L14.714 8V0zm9.714 7.429-2.285 2.285H9l-2 2v-2H4.429V1.143h9.142z"
			/>
			<path d="M11.857 3.143h-1.143V6.57h1.143zm-3.143 0H7.571V6.57h1.143z" />
		</svg>
	{:else if iconTag === 'kick'}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 250" fill="none">
			<g clip-path="url(#clip0_9790_492434)">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M15 90H38.5714V105.698H46.4286V97.8491H54.2857V90H77.8571V113.547H70V121.397H62.1429V129.246H70V137.095H77.8571V160.642H54.2857V152.793H46.4286V144.944H38.5714V160.642H15V90ZM172.143 90H195.714V105.698H203.571V97.8491H211.429V90H235V113.547H227.143V121.397H219.286V129.246H227.143V137.095H235V160.642H211.429V152.793H203.571V144.944H195.714V160.642H172.143V90ZM85.7143 90H109.286V160.642H85.7143V90ZM125 90V97.8491H117.143V152.793H125V160.642H164.286V137.095H140.714V113.547H164.286V90H125Z"
					fill="currentColor"
				/>
			</g>
		</svg>
	{:else if iconTag === 'fb'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 16 16"
		>
			<path
				d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"
			/>
		</svg>
	{:else if iconTag === 'niconico'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 24 24"
			role="img"
			><path
				d="M.4787 7.534v12.1279A2.0213 2.0213 0 0 0 2.5 21.6832h2.3888l1.323 2.0948a.4778.4778 0 0 0 .4043.2205.4778.4778 0 0 0 .441-.2205l1.323-2.0948h6.9828l1.323 2.0948a.4778.4778 0 0 0 .441.2205c.1838 0 .3308-.0735.4043-.2205l1.323-2.0948h2.6462a2.0213 2.0213 0 0 0 2.0213-2.0213V7.5339a2.0213 2.0213 0 0 0-2.0213-1.9845h-7.681l4.4468-4.4469L17.1637 0l-5.1452 5.1452L6.8 0 5.6973 1.1025l4.4102 4.4102H2.5367a2.0213 2.0213 0 0 0-2.058 2.058z"
			/>
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="currentColor"
			viewBox="0 0 16 16"
		>
			<path
				d="M2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5M13.991 3l.024.001a1.5 1.5 0 0 1 .538.143.76.76 0 0 1 .302.254c.067.1.145.277.145.602v5.991l-.001.024a1.5 1.5 0 0 1-.143.538.76.76 0 0 1-.254.302c-.1.067-.277.145-.602.145H2.009l-.024-.001a1.5 1.5 0 0 1-.538-.143.76.76 0 0 1-.302-.254C1.078 10.502 1 10.325 1 10V4.009l.001-.024a1.5 1.5 0 0 1 .143-.538.76.76 0 0 1 .254-.302C1.498 3.078 1.675 3 2 3zM14 2H2C0 2 0 4 0 4v6c0 2 2 2 2 2h12c2 0 2-2 2-2V4c0-2-2-2-2-2"
			/>
		</svg>{/if}
	<span>
		{pathName}
	</span>
</span>

<style lang="postcss">
	@reference "tailwindcss";

	.platform-tag {
		@apply inline-flex items-center space-x-2;
	}

	svg {
		height: 1em;
		width: 1em;
	}
</style>
