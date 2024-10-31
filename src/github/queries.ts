export const queries = {
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
