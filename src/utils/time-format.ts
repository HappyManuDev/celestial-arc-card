import type { HomeAssistant } from '../ha-types';

type HourCycle = 'h11' | 'h12' | 'h23' | 'h24';

function hourCycle(hass: HomeAssistant): HourCycle | undefined {
  switch (hass.locale?.time_format) {
    case '12':
      return 'h12';
    case '24':
      return 'h23';
    case 'system':
      return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;
    default:
      // 'language': let the language decide.
      return undefined;
  }
}

/** Time zone chosen in the user profile: the server's, or undefined for the browser's. */
function timeZone(hass: HomeAssistant): string | undefined {
  return hass.locale?.time_zone === 'server' && hass.config?.time_zone
    ? hass.config.time_zone
    : undefined;
}

/** Formats a time (hours:minutes) following the user's Home Assistant profile. */
export function formatTime(date: Date, hass: HomeAssistant): string {
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const cycle = hourCycle(hass);
  if (cycle) {
    options.hourCycle = cycle;
  }
  const zone = timeZone(hass);
  if (zone) {
    options.timeZone = zone;
  }
  const language = hass.locale?.language ?? hass.language ?? 'en';
  return new Intl.DateTimeFormat(language, options).format(date);
}

/** Minutes since midnight (0 → 1440), in the time zone of the user's profile. */
export function minutesOfDay(date: Date, hass: HomeAssistant): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
    timeZone: timeZone(hass),
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value('hour') * 60 + value('minute') + value('second') / 60;
}

/** Hour of day for an axis label ("06", "6 AM", "06 h"…), following the user's profile. */
export function formatHour(hour: number, hass: HomeAssistant): string {
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', timeZone: 'UTC' };
  const cycle = hourCycle(hass);
  if (cycle) {
    options.hourCycle = cycle;
  }
  const language = hass.locale?.language ?? hass.language ?? 'en';
  return new Intl.DateTimeFormat(language, options).format(Date.UTC(2000, 0, 1, hour));
}
