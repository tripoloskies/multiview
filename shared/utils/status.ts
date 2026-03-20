export async function isActiveStreamOnline(path: string): Promise<boolean> {
	try {
		const response = await fetch(
			`http://${Bun.env.MEDIAMTX_HOST}:8888/${path}/index.m3u8`
		);
		return response.status === 200;
	} catch {
		return false;
	}
}
