import { Tick } from "@sauber/backtest";

export type DateFormat = string;
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Number of ticks between dates */
export const diffDate = (start: DateFormat, end: DateFormat): number => {
  const start_d = Temporal.PlainDate.from(start);
  const end_d = Temporal.PlainDate.from(end);
  const duration = start_d.until(end_d);
  return duration.total("days");
};

/** Offset from Date */
export const nextDate = (start: DateFormat, days: number = 1): DateFormat => {
  const start_d = Temporal.PlainDate.from(start);
  const end_d = start_d.add({ days });
  return end_d.toString();
};

/** Todays date */
export const today = (): DateFormat => {
  return Temporal.Now.plainDateISO().toString();
};

// Two-way cache of converted dates based on start date
type startCache = {
  ticks: Record<DateFormat, Tick>;
  dates: Record<Tick, DateFormat>;
};
const _cache: Record<DateFormat, startCache> = {};

/** Convert dates to ticks and back based on a fixed start date for tick=0 */
export class Timeline {
  private readonly _ticks: Record<DateFormat, Tick>;
  private readonly _dates: Record<Tick, DateFormat>;

  /**
   * @param start - Date for tick=0
   */
  constructor(private readonly start: DateFormat) {
    if (!(start in _cache)) _cache[start] = { ticks: {}, dates: {} };
    this._ticks = _cache[start].ticks;
    this._dates = _cache[start].dates;
  }

  /** Lookup tick from date */
  public tick(date: DateFormat): Tick {
    if (!(date in this._ticks)) {
      const tick: Tick = diffDate(this.start, date);
      this._ticks[date] = tick;
      this._dates[tick] = date;
    }
    return this._ticks[date];
  }

  /** Lookup date from tick */
  public date(tick: Tick): DateFormat {
    if (!(tick in this._dates)) {
      const date: DateFormat = nextDate(this.start, tick);
      this._ticks[date] = tick;
      this._dates[tick] = date;
    }
    return this._dates[tick];
  }

  /** Which day of week is tick */
  public weekday(tick: Tick): Weekday {
    const date = new Date(this.date(tick));
    const currentWeekday = date.getDay() as Weekday;
    return currentWeekday;
  }

  /** Tick of next occurrence of a specific weekday */
  public nextWeekday(tick: Tick, weekday: number): Tick {
    const currentWeekday: Weekday = this.weekday(tick);
    const daysUntilNext = (weekday - currentWeekday + 7) % 7 || 7;
    return tick + daysUntilNext;
  }
}
