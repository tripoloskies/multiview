import type { wsActions } from "$websocket/websocket";
import z from "zod";

export const actions: wsActions = async (data) => {
  const schema = z.object({
    path: z.string().min(1),
  });

  try {
    const newData = await schema.parseAsync(data);
    return {
      success: true,
      message: `Opening instance ${newData.path}...`,
      data: {
        eventUrl: `/api/instance/logs?path=${encodeURIComponent(newData.path)}`,
      },
    };
  } catch (event) {
    if (event instanceof z.ZodError) {
      const items: PropertyKey[] = [];
      for (const issue of event.issues) {
        items.push(...issue.path);
      }
      return {
        success: false,
        message: `Please complete the fields. ${items.join(", ")}`,
      };
    }
    return {
      success: false,
      message: "There's a problem when opening a stream instance.",
    };
  }
};
