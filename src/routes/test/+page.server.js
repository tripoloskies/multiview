import { prisma } from '$lib/prisma'
import { Glob } from 'bun'
import { rm } from 'node:fs/promises';
import { dirname } from 'node:path';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {

    let fileLists = new Glob(`${locals.recordPath}/**/*.mp4`);

    /**
     * @type {{ id: string, fullPath: string }[]}
     */
    let paths = []
    /**
     * @type {string[]}
     */
    let idsToDeleted = [];


    let vodDbLists = await prisma.vodProps.findMany({
        select: {
            id: true
        }
    })
    
    for await (const file of fileLists.scan(".")) {
        let splicedPath = file.split("/");
        splicedPath.splice(0, splicedPath.length - 2);
        paths.push({ id: splicedPath[0], fullPath: file })
    }

    for (const lists of vodDbLists) {
        let pathindex = paths.findIndex(path => path.id === lists.id)
        if (pathindex === -1) {
            idsToDeleted.push(lists.id)
        }
        else {
            paths.splice(pathindex, 1)
        }
    }

    await prisma.vodProps.deleteMany({
    where: {
        id: {
            in: idsToDeleted
        }
    }
    })

    for (const path of paths) {
        await rm(dirname(path.fullPath), {
            force: true,
            recursive: true
        })
    }

    
}