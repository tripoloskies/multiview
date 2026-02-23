import z from "zod";
import { db } from "./database";

export const routes = {
  "/api/inform": {
    /**
     *
     * @param {import("bun").BunRequest} request
     * @returns
     */
    POST: async (request) => {
      /**
       * @type {import("bun:sqlite").Changes}
       */
      let result;

      /**
       * @type {import("bun:sqlite").Statement}
       */
      let statement;

      const data = Object.fromEntries((await request.formData()).entries());

      const schema = z.object({
        id: z.string().min(1),
        action: z.enum(["Update", "Delete"]),
        status: z.string().min(1),
      });

      try {
        let newData = await schema.parseAsync(data);
        const reqSelect = db.prepare("SELECT 1 FROM streams WHERE id=$id");

        switch (newData.action) {
          case "Update":
            if (!reqSelect.all({ $id: newData.id }).length) {
              statement = db.prepare(
                "INSERT OR IGNORE into streams VALUES ($id, $status)",
              );
            } else {
              statement = db.prepare(
                "UPDATE streams SET status=$status WHERE id=$id",
              );
            }
            break;
          case "Delete":
            statement = db.prepare("DELETE from streams WHERE id=$id");
            break;
          default:
            return new Response("-2");
        }

        result = statement.run({
          $id: newData.id,
          $status: newData.status,
        });

        // console.log(db.prepare("SELECT * FROM streams WHERE id=$id").all({$id: data?.id}))
        return new Response(JSON.stringify(result.changes));
      } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
          return new Response("-1");
        } else {
          return new Response("-3");
        }
      }
    },
  },
};
