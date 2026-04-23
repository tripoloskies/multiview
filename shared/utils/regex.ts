export const SEGMENT_TS_REGEX = /^segment\d+\.ts$/;
export const TWITCH_URL_REGEX: RegExp =
	/^(https?:\/\/)?([a-z0-9]+\.)?twitch\.tv/;
export const YT_URL_REGEX: RegExp =
	/^(https?:\/\/)?([a-z0-9]+\.)?(youtube\.com|youtu\.be)/;
export const KICK_URL_REGEX: RegExp = /^(https?:\/\/)?(www\.)?kick\.com/;
export const TIKTOK_URL_REGEX: RegExp = /^(https?:\/\/)?(www\.)?tiktok\.com/;
export const LIVE_PATH_REGEX: RegExp = /\/live$/;
export const PATH_REGEX: RegExp = /[^A-Za-z0-9/_-]+/g;
export const TRIM_LEAD_TRAIL_SLASH_REGEX: RegExp = /^[\\/]+|[\\/]+$/g;

export function getPlatformByPath(path: string): string | null {
	if (!path.length) {
		return null;
	}

	const firstPath = path.split('/')[0]?.toLowerCase();

	if (!firstPath?.length) {
		return null;
	}

	switch (firstPath) {
		case 'yt':
			return 'youtube';
			break;
		case 'twitch':
			return 'twitch';
			break;
		case 'tiktok':
			return 'tiktok';
			break;
		case 'kick':
			return 'kick';
			break;
		default:
			return 'others';
	}
}
