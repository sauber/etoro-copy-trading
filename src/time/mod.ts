export * from "./calendar.ts";
export * from "./progressbar.ts";

export type DateFormat = string;

/** A type of data that exists on different dates */
// export interface DateSeries<Element> {
//     /** All dates available */
//     dates(): DateFormat[];

//     /** The value on a given date */
//     value(date: DateFormat): Element;

//     /** First date */
//     start(): DateFormat;

//     /** Last date */
//     end(): DateFormat;

//     /** First value */
//     first(): Element;

//     /** Last value */
//     last(): Element;
// }

/** A type of data that exists on different dates with async accessors */
// export interface DateSeriesAsync<Element> {
//     /** All dates available */
//     dates(): Promise<DateFormat[]>;

//     /** The value on a given date */
//     value(date: DateFormat): Promise<Element>;

//     /** First date */
//     start(): Promise<DateFormat>;

//     /** Last date */
//     end(): Promise<DateFormat>;

//     /** First value */
//     first(): Promise<Element>;

//     /** Last value */
//     last(): Promise<Element>;
// }