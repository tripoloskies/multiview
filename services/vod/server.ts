import { Glob } from 'bun';
import { dirname } from 'node:path';
import { SEGMENT_REGEX } from '@shared/utils/browser';

const _server = Bun.serve({
	port: 3003,
	routes: {
		'/fetch/:id/:filename': {
			GET: async (request: Bun.BunRequest) => {
				let fp: Bun.BunFile;

				const responseHeaders = new Headers();
				const data = { ...request.params };

				const fileLists = new Glob(`${Bun.env.RECORD_PATH}/**/${data.id}/index.m3u8`);

				let path: string = '';

				for await (const file of fileLists.scan('.')) {
					path = dirname(file);
					break;
				}

				if (SEGMENT_REGEX.test(data?.filename || '')) {
					fp = Bun.file(`${path}/segments/${data.filename}`);
					responseHeaders.set('Content-Type', 'video/m2ts');
				} else if (data.filename === 'index.m3u8') {
					await Bun.sleep(100);
					fp = Bun.file(`${path}/${data.filename}`);
					responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
				} else if (data.filename === 'thumbnail.jpg') {
					fp = Bun.file(`${path}/${data.filename}`);
					responseHeaders.set('Content-Type', 'image/jpg');
				} else {
					console.error(
						`[VOD][fetch/:id/:filename]: Filename "${data.filename}" from VOD id "${data.id}" not found.`
					);
					return new Response(null, { status: 404 });
				}

				if (!(await fp.exists())) {
					console.error(
						`[VOD][fetch/:id/:filename]: Filename "${data.filename}" from VOD id "${data.id}" not found.`
					);
					return new Response(null, { status: 404 });
				}

				return new Response(fp, {
					headers: responseHeaders
				});
			}
		}
	}
});

console.log(`VOD Service API: Listening ${_server.hostname}:${_server.port}`);
