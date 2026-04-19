export function randomStringGenerator(): string {
	const chars: string =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const randomString = Array.from({ length: 10 }, () =>
		chars.charAt(Math.floor(Math.random() * chars.length))
	).join('');

	return randomString;
}

export function ellipsisGenerator(
	text: string,
	textLengthThreshold: number = 10
): string {
	return text.length >= textLengthThreshold
		? text.slice(0, textLengthThreshold - 1) + '...'
		: text;
}
