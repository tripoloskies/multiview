export const SEGMENT_REGEX = /^segment\d+\.ts$/;

export function randomStringGenerator(): string {
	const chars: string =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const randomString = Array.from({ length: 10 }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length))
	).join('');

	return randomString;
}
