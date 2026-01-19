import { Backend } from "@sauber/journal";
import { makeRepository } from "../repository/mod.ts";
import { Community, Investors } from "../community/mod.ts";
import { Frame, LineChart, Progress, Stack } from "@sauber/widgets";
import { Model } from "./model.ts";

// Load investor
const path = Deno.args[0];
const repo: Backend = makeRepository(path);
export const community: Community = new Community(repo);
export const investors: Investors = await community.all();

// Create a dashboard
const epochs = 500;
const chart = new LineChart([], 11);
const eta = new Progress("Epoch", epochs, 72);
const dashboard = new Frame(new Stack([chart, eta]), "Error");
console.log(dashboard.toString());

// Callback for updating dashboard while training
const update = (iteration: number, loss: number[]) => {
  chart.update(loss);
  eta.update(iteration);
  const cursorUp = `\u001b[${dashboard.height}A`; // Move cursor up
  console.log(cursorUp + dashboard.toString());
};

// Train Model
const batchsize = 256;
const model = Model.generate();
const losses: number[] = model.train(investors, epochs, batchsize, update);
console.log(
  "Loss improvements from",
  Number(losses[0].toPrecision(3)),
  "to",
  Number(losses[losses.length - 1].toPrecision(3)),
);

// Display correlation of actual vs prediction
model.validation(investors, 300);
