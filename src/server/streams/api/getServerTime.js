/**
 * @param {{}} data
 * @return {Promise<{success: boolean, message: string, data?: {}}>}
 */
// eslint-disable-next-line no-unused-vars
export const actions = async (data) => {
  const now = new Date();
  const time =
    now.toTimeString().split(" ")[0] +
    "." +
    now.getMilliseconds().toString().padStart(3, "0");
  return {
    success: true,
    message: "OK",
    data: {
      serverTime: time,
    },
  };
};
