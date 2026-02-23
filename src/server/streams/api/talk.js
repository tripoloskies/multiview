/**
 * @param {{}} data
 * @return {Promise<{success: boolean, message: string, data?: {}}>}
 */
// eslint-disable-next-line no-unused-vars
export const actions = async (data) => {
  try {
    let request = await fetch("http://127.0.0.1:9997/v3/info");
    if (request.status !== 200) {
      return {
        success: false,
        message: "MediaMTX server is not alive.",
      };
    }
    return {
      success: true,
      message: "MediaMTX server is alive.",
    };
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return {
      success: false,
      message: "MediaMTX server is not alive.",
    };
  }
};
