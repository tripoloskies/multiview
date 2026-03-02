import { error } from "@sveltejs/kit";
import { prisma } from "$lib/prisma.js";

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
  let page = Number(params.page);
  let visiblePages = [];
  const ITEMS_PER_PAGE = 9;
  const VISIBLE_PAGE_LIMIT = 4;

  if (isNaN(page)) {
    error(400, "Bad Request. Please check if the page number is valid or not.");
  } else if (page <= 0) {
    error(400, "Bad Request. There's no page 0 below!");
  }

  let itemCount = await prisma.vodProps.count();
  let data = await prisma.vodProps.findMany({
    select: {
      id: true,
      datePublished: true,
      creator: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      datePublished: "desc",
    },
    take: ITEMS_PER_PAGE,
    skip: ITEMS_PER_PAGE * page - ITEMS_PER_PAGE,
  });

  const pageCount = Math.ceil(itemCount / ITEMS_PER_PAGE);

  if (page <= VISIBLE_PAGE_LIMIT - 2) {
    for (let x = 1; x <= VISIBLE_PAGE_LIMIT; x++) {
      if (x > pageCount) {
        break;
      }
      visiblePages.push(x);
    }
  } else {
    if (pageCount - page < 2) {
      for (let x = pageCount - VISIBLE_PAGE_LIMIT; x <= pageCount; x++) {
        visiblePages.push(x);
      }
    } else {
      for (let x = page - 2; x <= page + 2; x++) {
        if (x > pageCount) {
          break;
        }
        visiblePages.push(x);
      }
    }
  }

  let list = data.map((list) => {
    const date = new Date(list.datePublished).toUTCString();
    return {
      id: list.id,
      title: date,
      author: list.creator.name,
      thumbnail: `http://${locals.host}:3000/api/vod/fetch/${list.id}/thumbnail.jpg`,
      link: `/recordings/play?id=${list.id}`,
    };
  });
  return {
    visiblePages: visiblePages,
    currentPage: page,
    pageCount: pageCount,
    pageLimit: VISIBLE_PAGE_LIMIT,
    itemCount: itemCount,
    lists: list,
  };
}
