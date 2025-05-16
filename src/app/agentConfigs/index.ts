// index.ts
import frontDeskAuthentication from "./frontDeskAuthentication";

export const defaultAgentSetKey = "frontDeskAuthentication";

export async function getAllAgentSets() {
  return {
    [defaultAgentSetKey]: await frontDeskAuthentication(),
  };
}
