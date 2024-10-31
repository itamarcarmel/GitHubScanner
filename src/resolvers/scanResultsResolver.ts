import _ from "lodash";
import { DetailedRepository, ResolverFn } from "../generated/types";
import { GithubGW, GithubRepoGW } from "../github";
import { ghBFSScan, IBlobHandler } from "../scanner";
import config from "../../config/config.json";

type IBlobHandlerExt = IBlobHandler & { finalize: () => Promise<void> };

const blobsCounter = (
  scanResults: DetailedRepository["scanResults"]
): IBlobHandlerExt => {
  let counter = 0;
  return {
    handle: () => {
      ++counter;
    },
    finalize: async () => {
      scanResults.numOfFiles = counter;
    },
    break: () => false,
  };
};

const yamlFinder = (
  scanResults: DetailedRepository["scanResults"],
  github: GithubRepoGW,
  name: string,
  owner: string
): IBlobHandlerExt => {
  let foundYaml = "";
  return {
    handle: (path) => {
      if (path.endsWith(`.${config.scanner.yamlExtension}/`))
        foundYaml = path.slice(0, -1);
    },
    finalize: async () => {
      if (_.isEmpty(foundYaml)) {
        return;
      }

      const content = await github.content(foundYaml);
      scanResults.randomYaml = {
        path: foundYaml,
        content,
      };
    },
    break: () => !_.isEmpty(foundYaml),
  };
};

const bhComposite = (bhs: IBlobHandler[]): IBlobHandler => ({
  handle: (path) => {
    bhs.map((bh) => bh.handle(path));
  },
  break: () => {
    const allWantToBreak = bhs.every((bh) => bh.break());
    return allWantToBreak;
  },
});

export const scanResults =
  (
    github: GithubGW
  ): ResolverFn<
    DetailedRepository["scanResults"],
    DetailedRepository,
    any,
    {}
  > =>
  async ({ base: { name, owner } }, _args, _context, info) => {
    const scanResults: DetailedRepository["scanResults"] = {
      numOfFiles: -1,
      randomYaml: null,
      numOfRequests: 0,
    };

    const fields =
      info.fieldNodes[0].selectionSet?.selections
        .map((s) => (s.kind === "Field" ? s : null))
        .filter(_.negate(_.isNil))
        .map((s) => s?.name.value as keyof DetailedRepository["scanResults"]) ??
      [];

    const blobHandlers: IBlobHandlerExt[] = [];

    const repo = github.repo(name, owner);

    if (fields.includes("numOfFiles"))
      blobHandlers.push(blobsCounter(scanResults));
    if (fields.includes("randomYaml"))
      blobHandlers.push(yamlFinder(scanResults, repo, name, owner));

    const numOfRequests = await ghBFSScan(repo, bhComposite(blobHandlers));

    await Promise.all(blobHandlers.map((bh) => bh.finalize()));

    return { ...scanResults, numOfRequests };
  };
