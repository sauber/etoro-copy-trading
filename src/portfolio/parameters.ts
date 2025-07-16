// Parameters for portfolio trading

import { IntegerParameter, Parameter, Parameters, StaticParameter } from "@sauber/optimize";
import { Asset, Backend } from "@sauber/journal";

// Defaults
const defaults: Parameters = [
  new IntegerParameter("weekday", 1, 5, 1),
  new Parameter("size", 0.01, 0.07, 0.05),
  new Parameter("stoploss", 0.05, 0.95, 0.85),
  new IntegerParameter("limit", 1, 5, 1),
  new StaticParameter("round", 200),
];

type Settings = Record<string, number>;
const assetName: string = "portfolio";



export async function loadPortfolioParameters(repo: Backend): Promise<Parameters> {
// Asset is used to store parameters for indicator
  const asset = new Asset<Settings>(assetName, repo);

  // Check if asset exists and retrieve settings, or create blank settings
  const settings: Settings = (await asset.exists())
    ? await asset.retrieve()
    : {};

      // Check if all required parameters are present
      let missing: boolean = false;
      for (const param of defaults) {
        if (!(param.name in settings)) {
          settings[param.name] = param.value; 
          missing = true;
        }
      }
      if (missing) await asset.store(settings);
      return createTimer(settings);
    
}