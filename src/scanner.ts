import _ from "lodash";
import { GithubRepoGW } from "./github";
import config from "./../config.json";
import * as uuid from "uuid";

export interface IBlobHandler {
  handle: (path: string) => void;
  finalize: () => Promise<void>;
  break: () => boolean;
}

export const ghBFSScan = async (
  github: GithubRepoGW,
  bh: Pick<IBlobHandler, "handle" | "break">
) => {
  const paths = [""];
  let requestCounter = 0;
  const id = uuid.v4();

  while (!_.isEmpty(paths)) {
    const chunk = paths.splice(0, config.scanner.concurrency);
    const entries = await Promise.all(
      chunk.map((path) =>
        github.entries(path).then((entries) =>
          entries.map((entry) => ({
            ...entry,
            path: `${path}${entry.name}/`,
          }))
        )
      )
    ).then(_.flatten);
    requestCounter += chunk.length;
    console.log({
      id,
      requestCounter,
      chunk: chunk.length,
      paths: paths.length,
    });

    const [blobs, others] = _.partition(entries, (e) => e.type === "blob");
    const trees = others.filter((other) => other.type === "tree");
    paths.push(...trees.map((tree) => tree.path));
    blobs.map((blob) => bh.handle(blob.path));
    if (bh.break()) {
      break;
    }

    await new Promise((resolve) =>
      setTimeout(resolve, config.scanner.sleepIntervalInMS)
    );
  }

  return requestCounter;
};
