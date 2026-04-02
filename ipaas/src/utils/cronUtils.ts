/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

export const INTERVAL_UNITS = ['Minute', 'Hour', 'Day', 'Week', 'Month'] as const;
export type IntervalUnit = (typeof INTERVAL_UNITS)[number];

export type CronField = 'minute' | 'hour' | 'dom' | 'month' | 'dow';

export const CRON_FIELD_LABELS = [
  { key: 'minute', label: 'minute (0 - 59)', placeholder: '*/1' },
  { key: 'hour', label: 'hour (0 - 23)', placeholder: '*' },
  { key: 'dom', label: 'day of month (1 - 31)', placeholder: '*' },
  { key: 'month', label: 'month (1 - 12)', placeholder: '*' },
  { key: 'dow', label: 'day of week (0 - 6, Sun=0)', placeholder: '*' },
] as const;

export function getTimezoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    const normalized = offset.replace(/^GMT$/, 'GMT+00:00').replace(/GMT([+-])(\d):/, 'GMT$10$2:');
    return `(${normalized}) ${tz}`;
  } catch {
    return tz;
  }
}

export const TIMEZONE_OPTIONS: { label: string; value: string }[] = (() => {
  try {
    return Intl.supportedValuesOf('timeZone').map((tz) => ({ label: getTimezoneLabel(tz), value: tz }));
  } catch {
    return [{ label: '(GMT+00:00) UTC', value: 'UTC' }];
  }
})();

export function intervalToCron(count: number, unit: IntervalUnit): string {
  const n = Math.max(1, count);
  switch (unit) {
    case 'Minute':
      return `*/${n} * * * *`;
    case 'Hour':
      return `0 */${n} * * *`;
    case 'Day':
      return `0 0 */${n} * *`;
    case 'Week':
      // 5-field cron has no weekly step; encode as a multiple of 7 days
      return `0 0 */${n * 7} * *`;
    case 'Month':
      return `0 0 1 */${n} *`;
  }
}

export function cronToInterval(cron: string): { count: number; unit: IntervalUnit } | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hour, dom, month, dow] = parts;
  if (min.startsWith('*/') && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    return { count: parseInt(min.slice(2), 10) || 1, unit: 'Minute' };
  }
  if (min === '0' && hour.startsWith('*/') && dom === '*' && month === '*' && dow === '*') {
    return { count: parseInt(hour.slice(2), 10) || 1, unit: 'Hour' };
  }
  if (min === '0' && hour === '0' && dom.startsWith('*/') && month === '*' && dow === '*') {
    const n = parseInt(dom.slice(2), 10) || 1;
    if (n % 7 === 0) return { count: n / 7, unit: 'Week' };
    return { count: n, unit: 'Day' };
  }
  if (min === '0' && hour === '0' && dom === '1' && month.startsWith('*/') && dow === '*') {
    return { count: parseInt(month.slice(2), 10) || 1, unit: 'Month' };
  }
  return null;
}

export function parseCronParts(cron: string): Record<CronField, string> {
  const parts = cron.trim().split(/\s+/);
  return {
    minute: parts[0] ?? '*',
    hour: parts[1] ?? '*',
    dom: parts[2] ?? '*',
    month: parts[3] ?? '*',
    dow: parts[4] ?? '*',
  };
}

export function buildCronFromParts(fields: Record<CronField, string>): string {
  return `${fields.minute} ${fields.hour} ${fields.dom} ${fields.month} ${fields.dow}`;
}

function expandCronField(field: string, min: number, max: number): Set<number> {
  const values = new Set<number>();
  for (const part of field.split(',')) {
    if (part === '*') {
      for (let i = min; i <= max; i++) values.add(i);
    } else if (part.startsWith('*/')) {
      const step = parseInt(part.slice(2), 10) || 1;
      for (let i = min; i <= max; i += step) values.add(i);
    } else if (part.includes('-')) {
      const [lo, hi] = part.split('-').map(Number);
      for (let i = lo; i <= hi; i++) values.add(i);
    } else {
      const v = parseInt(part, 10);
      if (!isNaN(v)) values.add(v);
    }
  }
  return values;
}

export function nextCronRunMs(cron: string): number | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minF, hourF, domF, monthF, dowF] = parts;

  const validMins = expandCronField(minF, 0, 59);
  const validHours = expandCronField(hourF, 0, 23);
  const validDoms = expandCronField(domF, 1, 31);
  const validMonths = expandCronField(monthF, 1, 12);
  const validDows = expandCronField(dowF, 0, 6);

  // Advance to the start of the next minute
  const candidate = new Date();
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  const limit = new Date(candidate.getTime() + 366 * 24 * 60 * 60 * 1000);

  while (candidate <= limit) {
    if (validMonths.has(candidate.getMonth() + 1) && validDoms.has(candidate.getDate()) && validDows.has(candidate.getDay()) && validHours.has(candidate.getHours()) && validMins.has(candidate.getMinutes())) {
      return candidate.getTime();
    }
    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  return null;
}

export function formatTimeUntil(ms: number): string {
  const diff = Math.max(0, ms - Date.now());
  const totalSecs = Math.round(diff / 1000);
  if (totalSecs < 60) return `${totalSecs}s`;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isSimple(field: string): boolean {
  return !field.includes('/') && !field.includes(',') && !field.includes('-');
}

export function describeCron(cron: string): string {
  const interval = cronToInterval(cron);
  if (interval) {
    const { count, unit } = interval;
    return `Executes every ${count === 1 ? unit.toLowerCase() : `${count} ${unit.toLowerCase()}s`}`;
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;
  const [min, hour, dom, month, dow] = parts;

  const descs: string[] = [];

  // Minute + hour combined
  const specificMin = min !== '*' && isSimple(min);
  const specificHour = hour !== '*' && isSimple(hour);

  if (min === '*' || min === '*/1') {
    descs.push('every minute');
  } else if (min.startsWith('*/')) {
    const n = parseInt(min.slice(2), 10);
    descs.push(`every ${n} minutes`);
  } else if (specificMin && specificHour) {
    const h = parseInt(hour, 10);
    const m = parseInt(min, 10);
    if (h === 0 && m === 0) {
      descs.push('at midnight');
    } else {
      const period = h < 12 ? 'AM' : 'PM';
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      descs.push(`at ${displayH}:${m.toString().padStart(2, '0')} ${period}`);
    }
  } else if (hour.startsWith('*/')) {
    const n = parseInt(hour.slice(2), 10);
    descs.push(n === 1 ? 'every hour' : `every ${n} hours`);
  }

  // DOM
  if (dom !== '*') {
    if (dom.startsWith('*/')) {
      const n = parseInt(dom.slice(2), 10);
      descs.push(n === 1 ? 'every day' : `every ${n} days`);
    } else if (isSimple(dom)) {
      descs.push(`on day ${dom}`);
    }
  }

  // Month
  if (month !== '*') {
    if (month.startsWith('*/')) {
      const n = parseInt(month.slice(2), 10);
      descs.push(n === 1 ? 'every month' : `every ${n} months`);
    } else if (isSimple(month)) {
      const m = parseInt(month, 10);
      descs.push(`in ${MONTH_NAMES[m - 1] ?? month}`);
    }
  }

  // DOW
  if (dow !== '*') {
    if (dow.startsWith('*/')) {
      const n = parseInt(dow.slice(2), 10);
      descs.push(n === 1 ? 'every day of the week' : `every ${n} days of the week`);
    } else if (isSimple(dow)) {
      const d = parseInt(dow, 10);
      descs.push(`on ${DAY_NAMES[d] ?? dow}`);
    }
  }

  if (descs.length === 0) return cron;
  return `Executes ${descs.join(', ')}`;
}
