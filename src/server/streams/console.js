import pm2 from "pm2";

let isConnected = false;
/**
 *
 * @returns {Promise<Boolean>}
 * @throws {{ fromConnect: true, error: Error }}
 */
export const pm2Connect = () => {
  if (isConnected) {
    return new Promise((resolve) => {
      resolve(true);
    });
  }

  return new Promise((resolve, reject) => {
    pm2.connect(true, (error) => {
      if (error) {
        reject(false);
        isConnected = false;
        return;
      }

      isConnected = true;
      resolve(true);
    });
  });
};

export const pm2Disconnect = () => {
  if (!isConnected) {
    return;
  }
  pm2.disconnect();
};
/**
 *
 * @param {pm2.StartOptions} options
 * @returns {Promise<pm2.Proc>}
 */
const pm2Start = (options) => {
  return new Promise((resolve, reject) => {
    pm2.start(options, (error, proc) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(proc);
    });
  });
};

/**
 *
 * @returns {Promise<pm2.ProcessDescription[]>}
 */
const pm2List = () => {
  return new Promise((resolve, reject) => {
    pm2.list((error, processDescriptionList) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(processDescriptionList);
    });
  });
};

/**
 *
 * @param {string | number} process
 * @returns {Promise<Boolean>}
 */
const pm2Delete = (process) => {
  return new Promise((resolve, reject) => {
    pm2.delete(process, (error) => {
      setTimeout(() => {
        if (error) {
          reject(error);
          return;
        }
        resolve(true);
      }, 1000);
    });
  });
};

/**
 *
 *
 * @param {string | number} process
 * @returns {Promise<pm2.ProcessDescription[]>}
 */
const pm2Describe = (process) => {
  return new Promise((resolve, reject) => {
    pm2.describe(process, (error, ProcessDescription) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(ProcessDescription);
    });
  });
};

const INTERNAL_REGEX = /^internal:\S*$/;

/**
 * createPM2Instance
 * @param {pm2.StartOptions} config
 */
async function createPM2Instance(config) {
  /**
   * @type {pm2.Proc}
   */
  let process;

  if (config?.name === undefined || config?.name == null) {
    return { success: false };
  }
  try {
    const description = await pm2Describe(config.name);
    if (description && description.length > 0) {
      await pm2Delete(config.name);
    }
    process = await pm2Start(config);
    console.log(`Started: ${config.name}`);
    return { success: true, process };
  } catch (err) {
    console.error("PM2 Async Error:", err);
  }
}
/**
 * checkPM2Instance
 * @param {string} name
 */
async function checkPM2Instance(name) {
  try {
    if (!name?.length) {
      return false;
    }
    const description = await pm2Describe(name);
    return description && description.length > 0;
  } catch (err) {
    console.error("PM2 Async Error:", err);
  }
}

/**
 * @param void
 */
export async function listPM2Instance() {
  try {
    let lists = await pm2List();
    lists = lists.filter((list) => !INTERNAL_REGEX.test(list?.name || ""));
    return lists;
  } catch (err) {
    console.error("PM2 Async Error:", err);
  }
}
/**
 * destroyPM2Instance
 * @param {string | string[]} name
 */
async function destroyPM2Instance(name) {
  try {
    if (typeof name === "string") {
      name = [name];
    }

    for (const _name of name) {
      if (!_name?.length) {
        continue;
      }

      const description = await pm2Describe(_name);
      if (description && description.length > 0) {
        await pm2Delete(_name);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("PM2 Async Error:", err);
  }
}

/**
 * destroyPM2Instance
 */
async function destroyStoppedPM2Instance() {
  try {
    let lists = await pm2List();

    for (const list of lists) {
      if (!list?.name) {
        continue;
      }
      if (list.pm2_env?.status === "stopped") {
        await pm2Delete(list.name);
      }
    }

    return true;
  } catch (err) {
    console.error("PM2 Async Error:", err);
  }
  return false;
}
/**
 * isStreamExists
 * @param {string} path
 * @returns
 */
export async function isStreamExists(path) {
  const pathRequest = await fetch(`http:/127.0.0.1:9997/v3/paths/get/${path}`);
  switch (pathRequest.status) {
    case 200:
      return true;
    // That's the only way to check if path exists without spending much time to parse the result.
    case 404:
      return false;
    default:
      throw new Error(
        "Something wrong with the server. Contact the administrator",
      );
  }
}

/**
 * addStreamInstance
 */
export async function listStreamInstance() {
  try {
    let lists = await listPM2Instance();

    /**
     * @type {{
     * 	name: string,
     * 	labelName: string,
     * 	active: boolean
     * }[]}
     */
    let newList = [];

    if (lists?.length) {
      for (const list of lists) {
        if (!list?.name?.length) {
          continue;
        }

        newList = [
          ...newList,
          {
            name: list.name,
            labelName: `${list.name} ${list?.pm2_env?.status}`,
            active: list?.pm2_env?.status !== "stopped",
          },
        ];
      }
    }
    return {
      success: true,
      message: "Stream instance created successfully!",
      list: newList,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "There's a problem when creating a stream instance.",
      list: [],
    };
  }
}

/**
 * addStreamInstance
 */
export async function deleteStoppedInstances() {
  if (await destroyStoppedPM2Instance()) {
    return {
      success: true,
      message: "OK",
    };
  } else {
    return {
      success: false,
      message: "Not OK",
    };
  }
}
/**
 * addStreamInstance
 * @param {string} url
 * @param {string} streamPath
 */
export async function addStreamInstance(url, streamPath) {
  await createPM2Instance({
    name: streamPath,
    script: `bash ./src/workers/stream-create.sh ${url} ${streamPath}`,
    autorestart: false,
    namespace: "stream", // This property is not working. If this property didn't exist in PM2 API docs, why this property still exist in npm's PM2 api?
  });
}

/**
 * checkStreamInstance
 * @param {string} streamPath
 */
export async function checkStreamInstance(streamPath) {
  return await checkPM2Instance(streamPath);
}

/**
 * checkStreamInstance
 * @param {string} streamPath
 */
export async function getStreamInstance(streamPath) {
  const lists = await listPM2Instance();
  return lists?.filter((list) => list.name === streamPath) ?? [];
}

/**
 * clearStreamInstance
 * @param {string} streamPath
 */
export async function deleteStreamInstance(streamPath) {
  if (await destroyPM2Instance(streamPath)) {
    return true;
  } else {
    return false;
  }
}
