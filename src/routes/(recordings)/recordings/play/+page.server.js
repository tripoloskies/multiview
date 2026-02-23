import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageServerLoad} */
export async function load({ url }) {
  const path = decodeURIComponent(url.searchParams.get("path") ?? "");
  const dateTimeUrl = decodeURIComponent(url.searchParams.get("date") ?? "");
  const specificDate = decodeURIComponent(
    url.searchParams.get("specificDate") ?? "",
  );
  /**
   * @type {{
   * "start": "string",
   * "duration": "string",
   * "url": "url"
   * }[]}
   */
  let timelineDataThisDate;
  if (!path?.length || !dateTimeUrl?.length) {
    redirect(307, "/recordings");
  }

  const dateTime = Number(dateTimeUrl);

  if (isNaN(dateTime)) {
    return {
      message: "Wrong start date format. Please check.",
      selectedPath: path,
      selectedDate: "",
      availableTimelineThisDate: [],
      startTime: null,
      duration: -1,
      mediaUrl: "",
    };
  }
  const beginTimeDate = new Date(dateTime);
  const endTimeDate = new Date(dateTime);

  beginTimeDate.setHours(0, 0, 0, 0);
  endTimeDate.setHours(23, 59, 59, 0);

  const beginTime = beginTimeDate.toISOString();
  const endTime = endTimeDate.toISOString();

  try {
    timelineDataThisDate = await (
      await fetch(
        `http://127.0.0.1:9996/list?path=${path}&start=${beginTime}&end=${endTime}&format=mp4`,
      )
    ).json();
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return {
      message: "There's an error retrieving the media. Please try again.",
      selectedPath: path,
      selectedDate: dateTime,
      availableTimelineThisDate: [],
      startTime: null,
      duration: -1,
      mediaUrl: "",
    };
  }

  if (!timelineDataThisDate?.length) {
    redirect(307, "/recordings");
  }
  if (!specificDate?.length) {
    redirect(
      307,
      `?path=${path}&date=${dateTime}&specificDate=${encodeURIComponent(timelineDataThisDate[0]?.start)}`,
    );
  }
  try {
    let targetSegmentData = timelineDataThisDate.find(
      (segment) => segment?.start === specificDate,
    );

    if (!targetSegmentData) {
      redirect(307, "/recordings");
    }

    let segmentMediaUrl = `http://${process.env.HOST}:9996/get?duration=${targetSegmentData?.duration}&path=${path}&start=${encodeURIComponent(targetSegmentData.start)}&format=mp4`;

    return {
      message: "Success",
      selectedPath: path,
      selectedDate: dateTime,
      availableTimelineThisDate: timelineDataThisDate,
      startTime: targetSegmentData?.start,
      duration: targetSegmentData?.duration,
      mediaUrl: segmentMediaUrl,
    };
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return {
      message: "There's an error retrieving the media. Please try again.",
      selectedPath: path,
      selectedDate: dateTime,
      availableTimelineThisDate: [],
      startTime: null,
      duration: -1,
      mediaUrl: "",
    };
  }
}
