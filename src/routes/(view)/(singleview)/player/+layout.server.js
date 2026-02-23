import { redirect } from "@sveltejs/kit";

export const load = async ({ params, route }) => {
  const path = params.path;
  const routeSegments = route.id.split("/");

  const isCurrentPagePlay = routeSegments[routeSegments.length - 2] === "play";

  if (path === undefined) {
    redirect(302, "/");
  }

  return {
    path: path,
    isCurrentPagePlay: isCurrentPagePlay,
  };
};
