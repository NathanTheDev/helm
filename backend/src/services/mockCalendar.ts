export interface MockCalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
}

interface MockEventSpec {
  title: string;
  dayOffset: number;
  startHour: number;
  startMinute?: number;
  durationMinutes: number;
  allDay?: boolean;
}

const EVENT_SPECS: MockEventSpec[] = [
  { title: "Standup", dayOffset: 0, startHour: 9, durationMinutes: 15 },
  { title: "1:1 with manager", dayOffset: 0, startHour: 14, durationMinutes: 30 },
  { title: "Dentist appointment", dayOffset: 1, startHour: 10, durationMinutes: 60 },
  { title: "Team planning", dayOffset: 2, startHour: 11, durationMinutes: 45 },
  { title: "Friend's birthday", dayOffset: 3, startHour: 0, durationMinutes: 0, allDay: true },
];

function atTime(dayOffset: number, hour: number, minute: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

export function getMockCalendarEvents(): MockCalendarEvent[] {
  return EVENT_SPECS.map((spec, i) => {
    const startsAt = atTime(spec.dayOffset, spec.startHour, spec.startMinute ?? 0);
    const endsAt = new Date(startsAt.getTime() + spec.durationMinutes * 60_000);
    return {
      id: `mock-${i}`,
      title: spec.title,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      allDay: spec.allDay ?? false,
    };
  });
}
