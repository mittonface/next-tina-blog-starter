import fs from "fs";
import { join } from "path";
import matter from "gray-matter";
import axios from "axios";

const postsDirectory = join(process.cwd(), "_posts");

export const GRAPHQL_ENDPOINT =
  "http://ec2-3-80-4-78.compute-1.amazonaws.com:1337/graphql";

export async function fetchGraphql(query) {
  const response = await axios.post(
    "http://ec2-3-80-4-78.compute-1.amazonaws.com:1337/graphql",
    { query: query },
    { headers: { "Content-Type": "application/json" } }
  );

  return response.data;
}

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug, fields = []) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items = {};

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = realSlug;
    }
    if (field === "content") {
      items[field] = content;
    }

    if (data[field]) {
      items[field] = data[field];
    }
  });

  return items;
}
