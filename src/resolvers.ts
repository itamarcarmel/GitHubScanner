import { Visibility, Resolvers } from "./generated/types";
import { GithubGW } from "./github";
import _ from "lodash";
import { scanResults } from "./scanResultsResolver";
import config from "./../config.json";
import { scanResultsWrapper } from "./scanLimiter";

export const createResolvers = (github: GithubGW): Resolvers => ({
  Query: {
    repositories: () =>
      github.repos().then((repos) =>
        repos.map(({ name, owner: { login }, diskUsage }) => ({
          name,
          owner: login,
          sizeInKB: diskUsage,
        }))
      ),
    repositoryDetails: async (_, { name, owner }) =>
      github
        .repo(name, owner)
        .details()
        .then(({ name, owner: { login }, diskUsage, isPrivate }) => ({
          base: {
            name,
            owner: login,
            sizeInKB: diskUsage,
          },
          visibility: isPrivate ? Visibility.Private : Visibility.Public,
          scanResults: {
            numOfFiles: -1,
            randomYaml: null,
            numOfRequests: -1,
          },
          webhooks: [],
        })),
    serverConfig: () => ({ text: JSON.stringify(config, null, 2) }),
  },
  DetailedRepository: {
    scanResults: scanResultsWrapper(scanResults(github)),
    webhooks: ({ base: { name, owner } }) =>
      github
        .repo(name, owner)
        .webhooks()
        .then((hooks) =>
          hooks.map(({ events, config: { url } }) => ({
            events,
            url,
          }))
        ),
  },
});
