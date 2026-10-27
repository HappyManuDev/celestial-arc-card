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

/** Formats a time (hours:minutes) following the user's Home Assistant profile. */
export function formatTime(date: Date, hass: HomeAssistant): string {
  const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  const cycle = hourCycle(hass);
  if (cycle) {
    options.hourCycle = cycle;
  }
  if (hass.locale?.time_zone === 'server' && hass.config?.time_zone) {
    options.timeZone = hass.config.time_zone;
  }
  const language = hass.locale?.language ?? hass.language ?? 'en';
  return new Intl.DateTimeFormat(language, options).format(date);
}
