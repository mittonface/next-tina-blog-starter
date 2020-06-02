import axios from "axios";

export const GRAPHQL_ENDPOINT =
  "http://ec2-3-80-4-78.compute-1.amazonaws.com:1337/graphql";

export async function fetchGraphql(query) {
  const response = await axios.post(
    GRAPHQL_ENDPOINT,
    { query: query },
    { headers: { "Content-Type": "application/json" } }
  );

  return response.data;
}
