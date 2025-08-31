import { IntegerParameter, Parameter } from "@sauber/optimize";
import { Limits } from "./mod.ts";

/** Key names and current values */
type Settings = Record<string, number>;
export type ParameterValues = Array<number>;


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
  private get(name: string): Parameter {
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
  // public values(): Array<number> {
  //   return this.parameters.map((p) => p.value);
  // }

  /** Set the values of all parameters */
  public set(values: Array<number>): this {
    if (values.length !== this.parameters.length) {
      throw new Error(
        `Expected ${this.parameters.length} values, got ${values.length}`,
      );
    }
    this.parameters.forEach((p, i) => p.set(values[i]));
    return this;
  }

  /** Get the names of all parameters */
  public names(): Array<string> {
    return this.parameters.map((p) => p.name);
  }

  /** Get the number of parameters */
  // public count(): number {
  //   return this.parameters.length;
  // }

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

  /** Import values */
  public import(settings: Settings): void {
    this.validate(settings);
    Object.entries(settings).forEach(([name, value]) => {
      const parameter = this.get(name);
      parameter.set(value);
    });
  }

  /** Validate settings fit parameters */
  public validate(settings: Settings): boolean {
    const names = this.names();
    for (const key of Object.keys(settings)) {
      if (!names.includes(key)) {
        throw new Error(`Unknown parameter ${key}`);
      }
    }
    for (const key of names) {
      if (!(key in settings)) {
        throw new Error(`Missing parameter ${key}`);
      }
    }
    return true;
  }

  /** Create a set of clone parameters with random values */
  public random(): Parameters {
    return new Parameters(this.parameters.map((p) => p.clone(p.random)));
  }
}
