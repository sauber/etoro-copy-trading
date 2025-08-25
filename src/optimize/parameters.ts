import { IntegerParameter, Parameter } from "@sauber/optimize";
import { Limits } from "./mod.ts";

/** Key names and current values */
type Settings = Record<string, number>;

/** Handle a group of parameters */
export class Parameters {
  constructor(private readonly parameters: Array<Parameter>) {}

  /** Initialize parameters from list of limits */
  public static fromLimits(limits: Limits): Parameters {
    const parameters = Object.entries(limits).map(([name, limit]) =>
      (limit.int)
        ? new IntegerParameter(name, limit.min, limit.max, limit.default)
        : new Parameter(name, limit.min, limit.max, limit.default)
    );
    return new this(parameters);
  }

  /** Get a parameter by name */
  public get(name: string): Parameter {
    const parameter = this.parameters.find((p) => p.name === name);
    if (!parameter) {
      throw new Error(`Parameter ${name} not found`);
    }
    return parameter;
  }

  /** Get all parameters */
  public all(): Array<Parameter> {
    return this.parameters;
  }

  /** Get the values of all parameters */
  public values(): Array<number> {
    return this.parameters.map((p) => p.value);
  }

  /** Set the values of all parameters */
  public set(values: Array<number>): void {
    if (values.length !== this.parameters.length) {
      throw new Error(
        `Expected ${this.parameters.length} values, got ${values.length}`,
      );
    }
    this.parameters.forEach((p, i) => p.set(values[i]));
  }

  /** Get the names of all parameters */
  public names(): Array<string> {
    return this.parameters.map((p) => p.name);
  }

  /** Get the number of parameters */
  public count(): number {
    return this.parameters.length;
  }

  /** Keys and values */
  public settings(): Settings {
    return Object.fromEntries(
      this.parameters.map((p) => [p.name, p.value]),
    );
  }

  /** Export keys and values */
  public export(): Settings {
    return this.settings();
  }

  /** Import keys and values */
  public import(settings: Settings): void {
    Object.entries(settings).forEach(([name, value]) => {
      const parameter = this.get(name);
      parameter.set(value);
    });
  }

  /** Validate settings fit parameters */
  public validate(settings: Settings): boolean {
    for (const key of Object.keys(settings)) {
      if (!(key in this.parameters)) {
        throw new Error(`Unknown parameter ${key}`);
      }
    }
    for (const key of Object.keys(this.parameters)) {
      if (!(key in settings)) {
        throw new Error(`Missing parameter ${key}`);
      }
    }
    return true;
  }
}
