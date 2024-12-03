import { Parameter, ParameterData } from "📚/optimize/parameter.ts";

/** Collection of parameters */
export class Parameters {
  constructor(private readonly list: Array<Parameter> = []) {}

  /** Export parameters properties */
  public export(): Array<ParameterData> {
    return this.list.map((p) => p.export());
  }

  /** Import parameters from exported values */
  public static import(data: Array<ParameterData>) {
    return new Parameters(data.map((d) => Parameter.import(d)));
  }

  /** Get named parameter */
  public get(name: string): Parameter {
    return this.list.filter((p) => p.name === name)[0];
  }

  /** Generate new set of same parameters with random values */
  public get random(): Parameters {
    return new Parameters(
      this.list.map((p) => new Parameter(p.name, p.min, p.max)),
    );
  }

  /** List of all parameters */
  public get all(): Array<Parameter> {
    return this.list;
  }
}
