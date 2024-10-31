import { ApolloServer } from "apollo-server";
import { readFileSync } from "fs";
import { createResolvers } from "./resolvers";
import path from "path";
import { createGithubGW } from "./github";
import config from "./../config.json";

const main = () => {
  const github = createGithubGW(config.github.username, config.github.token);
  const resolvers = createResolvers(github);
  const typeDefs = readFileSync(path.join(__dirname, "schema.graphql"), "utf8");
  const server = new ApolloServer({ typeDefs, resolvers });

  server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`);
  });
};

main();
