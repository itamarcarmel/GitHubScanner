import axios from "axios";
import _ from "lodash";
import config from "./../config.json";

const url = config.github.graphqlUrl;

const queries = {
  repos: `
    query($username: String!) {
      user(login: $username) {
        repositories(first: 100) {
          nodes {
            name
            owner {
              login
            }
            diskUsage
          }
        }
      }
    }
  `,
  repo: `
    query($owner: String!, $repoName: String!) {
      repository(owner: $owner, name: $repoName) {
        name
        owner {
          login
        }
        diskUsage
        isPrivate
      }
    }
  `,
  entries: `
   query($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Tree {
            entries {
              type
              name
            }
          }
        }
      }
    }
  `,
  content: `
    query($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Blob {
            text
          }
        }
      }
    }
  `,
};

export const createGithubGW = (username: string, token: string) => {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return {
    repos: async () => {
      const response = await axios.post<{
        data: {
          user: {
            repositories: {
              nodes: {
                name: string;
                owner: { login: string };
                diskUsage: number;
              }[];
            };
          };
        };
      }>(
        url,
        {
          query: queries.repos,
          variables: {
            username,
          },
        },
        {
          headers,
        }
      );

      return response?.data?.data?.user?.repositories?.nodes ?? [];
    },
    repo: (name: string, owner: string) => ({
      details: async () => {
        const response = await axios.post<{
          data: {
            repository: {
              name: string;
              owner: {
                login: string;
              };
              diskUsage: number;
              isPrivate: boolean;
            };
          };
        }>(
          url,
          {
            query: queries.repo,
            variables: {
              owner,
              repoName: name,
            },
          },
          {
            headers,
          }
        );

        return response?.data?.data?.repository;
      },
      webhooks: async () => {
        const response = await axios.get<
          {
            active: boolean;
            events: string[];
            config: {
              url: string;
            };
          }[]
        >(`${config.github.restUrl}/repos/${owner}/${name}/hooks`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        });

        const hooks = (response?.data ?? []).filter((e) => e.active);
        return hooks;
      },
      content: async (path: string) => {
        const response = await axios.post<{
          data: {
            repository: {
              object: {
                text: string;
              };
            };
          };
        }>(
          url,
          {
            query: queries.content,
            variables: {
              owner,
              name,
              expression: `HEAD:${path}`,
            },
          },
          {
            headers,
          }
        );

        return response?.data?.data?.repository?.object?.text ?? "";
      },
      entries: async (path: string) => {
        const response = await axios.post<{
          data: {
            repository: {
              object: {
                entries: {
                  type: "blob" | "tree" | string;
                  name: string;
                }[];
              };
            };
          };
        }>(
          url,
          {
            query: queries.entries,
            variables: {
              owner,
              name,
              expression: `HEAD:${path}`,
            },
          },
          {
            headers,
          }
        );

        return response?.data?.data?.repository?.object?.entries ?? [];
      },
    }),
  };
};

export type GithubGW = ReturnType<typeof createGithubGW>;
export type GithubRepoGW = ReturnType<GithubGW["repo"]>;
