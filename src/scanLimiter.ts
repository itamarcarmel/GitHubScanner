import _ from "lodash";
import { scanResults } from "./scanResultsResolver";
import config from "./../config.json";

const activeScans: Record<string, number> = {};

export const scanResultsWrapper =
  (wrapped: ReturnType<typeof scanResults>): typeof wrapped =>
  async (parent, ...params) => {
    const {
      base: { owner, name },
    } = parent;

    const key = `${owner}/${name}`;
    const found = activeScans[key] ?? 0;
    if (found >= config.scanner.maxScansPerRepo) {
      throw new Error("Too many scan requests!");
    }

    activeScans[key] = found + 1;

    const decrement = () => {
      activeScans[key] = activeScans[key] - 1;
    };

    try {
      const res = await wrapped(parent, ...params);
      decrement();
      return res;
    } catch (e) {
      decrement();
      console.error(e);
      throw e;
    }
  };
