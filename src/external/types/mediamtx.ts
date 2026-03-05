export type controlApiPathsList = {
  name: string;
  confName: string;
  ready: boolean;
  readyTime: string;
  online: boolean;
  onlineTime: string;
};

export type controlApiPathsResponse = {
  pageCount: string;
  itemCount: string;
  items: controlApiPathsList[];
};
