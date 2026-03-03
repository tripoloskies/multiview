import pm2 from "pm2";

let isConnected: boolean = false;

export type streamInstance = {
  name: string;
  labelName: string;
  active: boolean;
};

export const pm2Connect = (): Promise<boolean> => {
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

export const pm2Disconnect = (): void => {
  if (!isConnected) {
    return;
  }
  pm2.disconnect();
};

const pm2Start = (options: pm2.StartOptions): Promise<pm2.Proc> => {
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

const pm2List = (): Promise<pm2.ProcessDescription[]> => {
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

const pm2Delete = (process: string | number): Promise<boolean> => {
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

const pm2Describe = (
  process: string | number,
): Promise<pm2.ProcessDescription[]> => {
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

const INTERNAL_REGEX: RegExp = /^internal:\S*$/;

async function createPM2Instance(config: pm2.StartOptions): Promise<boolean> {
  if (!config?.name) {
    return false;
  }
  try {
    const description = await pm2Describe(config.name);
    if (description && description.length > 0) {
      await pm2Delete(config.name);
    }
    await pm2Start(config);
    console.log(`Started: ${config.name}`);
    return true;
  } catch (err) {
    console.error("PM2 Async Error:", err);
    return false;
  }
}

async function checkPM2Instance(name: string): Promise<boolean> {
  try {
    if (name?.length) {
      return false;
    }
    const description = await pm2Describe(name);
    return description && description.length > 0;
  } catch (err) {
    console.error("PM2 Async Error:", err);
    return false;
  }
}

export async function listPM2Instance(): Promise<pm2.ProcessDescription[]> {
  let lists: pm2.ProcessDescription[] = [];
  try {
    lists = await pm2List();
  } catch (err) {
    console.error("PM2 Async Error:", err);
  }
  return lists.filter((list) => !INTERNAL_REGEX.test(list?.name || ""));
}

async function destroyPM2Instance(name: string | string[]): Promise<boolean> {
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
  } catch (err) {
    console.error("PM2 Async Error:", err);
  }
  return false;
}

async function destroyStoppedPM2Instance(): Promise<boolean> {
  try {
    const lists = await pm2List();

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
    return false;
  }
}

export async function isStreamExists(path: string): Promise<boolean> {
  const pathRequest = await fetch(
    `http:/${Bun.env.MEDIAMTX_HOST}:9997/v3/paths/get/${path}`,
  );
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

export async function listStreamInstance(): Promise<streamInstance[]> {
  const newLists: streamInstance[] = [];
  try {
    const lists = await listPM2Instance();
    if (lists?.length) {
      for (const list of lists) {
        if (!list?.name?.length) {
          continue;
        }
        newLists.push({
          name: list.name,
          labelName: `${list.name} ${list?.pm2_env?.status}`,
          active: list?.pm2_env?.status !== "stopped",
        });
      }
    }
  } catch {
    return [];
  }
  return newLists;
}

export async function deleteStoppedInstances(): Promise<boolean> {
  return await destroyStoppedPM2Instance();
}

export async function addStreamInstance(
  url: string,
  streamPath: string,
): Promise<void> {
  await createPM2Instance({
    name: streamPath,
    script: `bash ./src/workers/stream-create.sh ${url} ${streamPath}`,
    autorestart: false,
    namespace: "stream", // This property is not working. If this property didn't exist in PM2 API docs, why this property still exist in npm's PM2 api?
  });
}

export async function checkStreamInstance(
  streamPath: string,
): Promise<boolean> {
  return await checkPM2Instance(streamPath);
}

export async function getStreamInstance(
  streamPath: string,
): Promise<pm2.ProcessDescription[]> {
  const lists = await listPM2Instance();
  return lists?.filter((list) => list.name === streamPath) ?? [];
}

export async function deleteStreamInstance(
  streamPath: string,
): Promise<boolean> {
  return await destroyPM2Instance(streamPath);
}
