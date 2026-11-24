import { normalize } from "./model.js";
import { applyCongressData } from "./congress.js";
import { decorateBills } from "./explore.js";

export function buildBills(rows, official, lifecycle) {
  return decorateBills(applyCongressData(normalize(rows), official), lifecycle);
}
