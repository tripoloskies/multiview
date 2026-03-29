export async function isInstanceOnline(path: string): Promise<boolean> {
	try {
		const response = await fetch(
			`http://${Bun.env.STREAMING_HOST}:8888/${path}/index.m3u8`
		);
		return response.status === 200;
	} catch {
		return false;
	}
}
