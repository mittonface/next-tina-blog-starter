import Container from "../components/container";
import MoreStories from "../components/more-stories";
import HeroPost from "../components/hero-post";
import Intro from "../components/intro";
import Layout from "../components/layout";
import Head from "next/head";
import { CMS_NAME } from "../lib/constants";
import { fetchGraphql } from "../lib/api";

export default function Index({ allPosts }) {
  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);
  return (
    <>
      <Layout>
        <Head>
          <title>Next.js Blog Example with {CMS_NAME}</title>
        </Head>
        <Container>
          <Intro />
          {heroPost && (
            <HeroPost
              title={heroPost.title}
              coverImage={heroPost.coverImage}
              date={heroPost.date}
              author={heroPost.author}
              slug={heroPost.slug}
              excerpt={heroPost.excerpt}
            />
          )}
          {morePosts.length > 0 && <MoreStories posts={morePosts} />}
        </Container>
      </Layout>
    </>
  );
}

export async function getStaticProps({ preview, previewData }) {
  const queryResponse = await fetchGraphql(`
  query {
    blogPosts {
      title
      date
      slug
      excerpt
      coverImage {
        url
      }
      author {
        name
      }
    }
  }
  `);

  const allPosts = queryResponse.data.blogPosts;

  if (preview) {
    return {
      props: {
        allPosts,
        preview,
        ...previewData,
      },
    };
  }
  return {
    props: { allPosts, preview: false },
  };
}
