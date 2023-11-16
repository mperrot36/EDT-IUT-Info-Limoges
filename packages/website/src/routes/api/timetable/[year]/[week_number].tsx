import { type APIEvent, json } from "solid-start/api";
import { YEARS } from "edt-iut-info-limoges";

import {
  connectDatabase,
  getCachedEntries,
  getCachedTimetable
} from "~/database";

export const GET = async ({ params }: APIEvent) => {
  const year = params.year as YEARS;

  if (Object.values(YEARS).indexOf(year) === -1) {
    return json({
      success: false,
      message: "Invalid year."
    }, { status: 400 });
  }

  const week_number = parseInt(params.week_number);

  if (isNaN(week_number) || week_number < 1 || week_number > 52) {
    return json({
      success: false,
      message: "Invalid week number."
    }, { status: 400 });
  }

  const entries = await getCachedEntries(year);
  await connectDatabase();

  const timetable_entry = entries.find(entry => entry.week_number === week_number);
  if (!timetable_entry) {
    return json({
      success: false,
      message: "Timetable not found."
    }, { status: 404 });
  }

  const timetable = await getCachedTimetable(timetable_entry);

  return json({
    success: true,
    data: timetable
  }, { status: 200 });
};
