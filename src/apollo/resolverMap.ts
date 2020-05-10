import { IResolvers } from "graphql-tools";
const resolverMap: IResolvers = {
  Query: {
    hello(_: void, args: void): string {
      return `👋 Hello world! 👋`;
    }
  }
};
export default resolverMap;
