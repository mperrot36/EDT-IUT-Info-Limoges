import { type Component, For, Show } from "solid-js";
import { useWindowSize } from "@solid-primitives/resize-observer";
import type { ITimetableHeader, ITimetableLesson } from "~/types/api";

import { getDayFromTimetable, getDayString, getHourString } from "~/utils/dates";
import { TIMETABLE_HOURS } from "~/utils/hours";
import { getLessonDescription } from "~/utils/lessons";

import MdiCheck from '~icons/mdi/check';

const FixedHeightDayTimetableLesson: Component<{
  lessons: ITimetableLesson[]
  lesson?: ITimetableLesson
  is_last_hour: boolean;
}> = (props) => {
  const windowSize = useWindowSize();
  const lessonHeight = () => ((windowSize.height - 48) / TIMETABLE_HOURS.length);

  const lesson_before = (): ITimetableLesson | undefined => {
    const lessonIndex = props.lessons.findIndex(
      (lesson) => lesson.start_date === props.lesson?.start_date
    );

    if (lessonIndex === -1) return;
    return props.lessons[lessonIndex - 1];
  }
  
  const currentDurationLength = () => {
    if (!props.lesson) return 0;
    const start_date = new Date(props.lesson.start_date);
    const end_date = new Date(props.lesson.end_date);
    const start_hour = getHourString(start_date);
    const end_hour = getHourString(end_date);

    const start_index = TIMETABLE_HOURS.findIndex((hour) => hour === start_hour);
    const end_index = TIMETABLE_HOURS.findIndex((hour) => hour === end_hour);

    return end_index - start_index;
  }

  const thereIsBreakBefore = (): boolean => {
    if (!props.lesson) return false;
    const l_before = lesson_before();
    // Start of day so we say there's a break.
    if (!l_before) return true;

    const start_date = new Date(props.lesson.start_date);
    const end_date = new Date(l_before.end_date);
  
    const isNotSameHour = start_date.getHours() !== end_date.getHours();
    const isNotSameMinutes = start_date.getMinutes() !== end_date.getMinutes();
    
    return isNotSameHour || isNotSameMinutes; 
  };

  const breakDurationLength = () => {
    if (!props.lesson) return 0;
    const start_date = new Date(props.lesson.start_date);
    
    let end_index = 0; // When there's no lesson before, it's the start of day.
    const l_before = lesson_before();
    if (l_before) {
      const end_date = new Date(l_before.end_date);
      const end_hour = getHourString(end_date);
      end_index = TIMETABLE_HOURS.findIndex((hour) => hour === end_hour);
    }

    const start_hour = getHourString(start_date);
    const start_index = TIMETABLE_HOURS.findIndex((hour) => hour === start_hour);

    return start_index - end_index;
  }

  return (
    <Show when={props.lesson}>
      {lesson => (
        <>
          <Show when={thereIsBreakBefore() && breakDurationLength()}>
            <div style={{
              height: (lessonHeight() * breakDurationLength()) + "px"
            }} />
          </Show>
          
          <div class="border-t border-t-red bg-[rgb(30,30,30)] overflow-hidden" style={{
            height: (lessonHeight() * currentDurationLength()) + "px"
          }}>
            <div class="flex justify-between px-4 pt-2 gap-4">
              <p class="text-sm text-[rgb(240,240,240)]">
                {getLessonDescription(lesson())}
              </p>
              <p class="text-sm text-[rgb(21,21,21)] bg-red rounded-full font-medium px-3 py-0.5 h-fit">
                {lesson().content.room}
              </p>
            </div>
          </div>
        </>
      )}
    </Show>
  )
}

const FixedHeightDayTimetable: Component<{
  header: ITimetableHeader;
  lessons: ITimetableLesson[];
  isToday: boolean;
  dayIndex: number;
}> = (props) => {
  const day = () => getDayFromTimetable(props.header, props.dayIndex);

  /**
   * Find the lesson for the given hour.
   * @param hour_from_ref The hour to find the lesson for. Format: `HH:MM`.
   */
  const findLessonForGivenHour = (hour_from_ref: string): ITimetableLesson | undefined => {
    const lesson = props.lessons.find((lesson) => {
      const start_date = new Date(lesson.start_date);
      const start_hour = getHourString(start_date);
      return start_hour === hour_from_ref;
    });

    return lesson;
  }

  return (
    <div class="w-full relative pt-6">
      <div class="absolute top-3 left-0 right-0">
        <div class="w-fit mx-auto bg-red px-4 py-1 rounded-full">
          <p class="text-sm text-[rgb(18,18,18)] font-medium">
            {getDayString(day())}
          </p>
        </div>
      </div>

      <div class="h-[calc(100vh-48px)] rounded-lg py-6 mx-4"
        classList={{
          "border-2 border-red": props.isToday
        }}
      >
        <For each={TIMETABLE_HOURS} fallback={
          <div class="flex flex-col gap-2 items-center pt-4">
            <MdiCheck class="text-2xl text-[rgb(240,240,240)]" />
            <p class="text-[rgb(200,200,200)]">
              Pas de cours !
            </p>
          </div>
        }>
          {(hour, lessonIndex) => (
            <FixedHeightDayTimetableLesson
              lessons={props.lessons}
              lesson={findLessonForGivenHour(hour)}
              is_last_hour={lessonIndex() === props.lessons.length - 1}
            />
          )}
        </For>
      </div>
    </div>
  );
};

export default FixedHeightDayTimetable;
