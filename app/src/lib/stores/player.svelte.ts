type PlayerStateStoreType = {
	isActionPageActive: boolean;
	sourceId: string | null;
	platform: string;
	lowLatency: boolean;
	online: boolean;
};

export const state: PlayerStateStoreType = $state({
	isActionPageActive: false,
	sourceId: null,
	platform: '',
	lowLatency: false,
	online: false
});

export function reset() {
	state.isActionPageActive = false;
	state.sourceId = null;
	state.platform = '';
	state.lowLatency = false;
	state.online = false;
	state.isActionPageActive = false;
}
