import {
  deleteStoppedInstances,
  listStreamInstance,
} from "$server/streams/console";
import { db } from "$server/database";

/**
 * @param {{}} data
 * @return {Promise<{success: boolean, message: string, data?: {}}>}
 */
// eslint-disable-next-line no-unused-vars
export const actions = async (data) => {
  try {
    let request = await fetch(
      `http://${Bun.env.MEDIAMTX_HOST}:9997/v3/paths/list`,
    );

    if (request.status !== 200) {
      return {
        success: false,
        message: "MediaMTX server is not alive.",
      };
    }
    /**
     * @type {{
     *  pageCount: string,
     *  itemCount: string,
     *  items: [{
     *      name: string,
     *      confName: string,
     *      ready: boolean,
     *      readyTime: string,
     *      online: boolean,
     *      onlineTime: string,
     *  }]
     * }}
     */
    let listData = await request.json();
    let pm2InstanceLists = await listStreamInstance();
    await deleteStoppedInstances();

    let instanceLists = pm2InstanceLists.list.map((instance) => {
      const statusQuery = db
        .query("SELECT status from streams WHERE id=$id")
        .values({ $id: instance.name });
      let status = "No Report";
      if (statusQuery.length) {
        status = String(statusQuery[0]);
      }

      return {
        ...instance,
        status: status,
      };
    });
    return {
      success: true,
      message: "OK",
      data: {
        paths: listData?.items || [],
        instances: instanceLists,
      },
    };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Not OK",
    };
  }
};
