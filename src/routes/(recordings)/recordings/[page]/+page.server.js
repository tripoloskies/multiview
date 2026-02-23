import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch, params, locals }) {
  let page = Number(params.page);
  const VISIBLE_PAGE_LIMIT = 5;

  if (isNaN(page)) {
    error(400, "Bad Request. Please check if the page number is valid or not.");
  } else if (page <= 0) {
    error(400, "Bad Request. There's no page 0 below!");
  }
  try {
    /**
     * @type {{
     *  pageCount: number,
     *  itemCount: number,
     *  items: [{
     *      name: string,
     *      segments: [{
     *          "start": "string"
     *      }]
     *  }]
     * }}
     */
    let searchData = await (
      await fetch(
        `http://${locals.host}:9997/v3/recordings/list?itemsPerPage=10&page=${page - 1}`,
      )
    ).json();
    let items = searchData.items.map((item) => {
      /**
       * @type {Set<number>}
       */
      let publishedDate = new Set();
      for (const segment of item.segments) {
        let segmentStart = new Date(segment.start);
        segmentStart.setHours(0, 0, 0, 0);
        let date = segmentStart.getTime();
        publishedDate.add(date);
      }
      return {
        name: item.name,
        publishedDate: [...publishedDate],
      };
    });

    let visiblePages = [];

    if (page <= VISIBLE_PAGE_LIMIT - 2) {
      for (let x = 1; x <= VISIBLE_PAGE_LIMIT; x++) {
        if (x > searchData.pageCount) {
          break;
        }
        visiblePages.push(x);
      }
    } else {
      for (let x = page - 2; x <= page + 2; x++) {
        if (x > searchData.pageCount) {
          break;
        }
        visiblePages.push(x);
      }
    }
    return {
      visiblePages: visiblePages,
      currentPage: page,
      pageCount: searchData.pageCount,
      itemCount: searchData.itemCount,
      latestRecordingsList: items,
    };
  } catch (e) {
    console.log(e);
  }
}
