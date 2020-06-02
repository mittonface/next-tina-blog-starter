import { useRouter } from "next/router";
import ErrorPage from "next/error";
import Container from "../../components/container";
import PostBody from "../../components/post-body";
import Header from "../../components/header";
import PostHeader from "../../components/post-header";
import Layout from "../../components/layout";
import PostTitle from "../../components/post-title";
import Head from "next/head";
import { CMS_NAME } from "../../lib/constants";
import markdownToHtml from "../../lib/markdownToHtml";
import { useState, useEffect, useMemo } from "react";
import { useForm, usePlugin } from "tinacms";
import { fetchGraphql } from "../../lib/api";

export default function Post({ post: initialPost, morePosts, preview }) {
  const router = useRouter();
  if (!router.isFallback && !initialPost?.slug) {
    return <ErrorPage statusCode={404} />;
  }

  const formConfig = {
    id: initialPost.slug,
    label: "Blog Post",
    initialValues: initialPost,
    onSubmit: async (values) => {
      const saveMutation = `
      mutation {
        updateBlogPost(
          input: {
            where: { id: ${values.id} }
            data: { title: "${values.title}", content: """${values.rawMarkdownBody}""" }
          }
        ) {
          blogPost {
            id
          }
        }
      }
      `;

      const response = await fetchGraphql(saveMutation);
    },
    fields: [
      {
        name: "title",
        label: "Post Title",
        component: "text",
      },
      {
        name: "rawMarkdownBody",
        label: "Content",
        component: "markdown",
      },
    ],
  };

  const [post, form] = useForm(formConfig);
  usePlugin(form);

  const [htmlContent, setHtmlContent] = useState(post.content);
  const initialContent = useMemo(() => post.rawMarkdownBody, []);
  useEffect(() => {
    if (initialContent == post.rawMarkdownBody) return;
    markdownToHtml(post.rawMarkdownBody).then(setHtmlContent);
  }, [post.rawMarkdownBody]);

  return (
    <Layout preview={preview}>
      <Container>
        <Header />
        {router.isFallback ? (
          <PostTitle>Loading…</PostTitle>
        ) : (
          <>
            <article className="mb-32">
              <Head>
                <title>
                  {post.title} | Next.js Blog Example with {CMS_NAME}
                </title>
                <meta
                  property="og:image"
                  content={
                    `http://ec2-3-80-4-78.compute-1.amazonaws.com:1337` +
                    post.coverImage.url
                  }
                />
              </Head>
              <PostHeader
                title={post.title}
                coverImage={
                  `http://ec2-3-80-4-78.compute-1.amazonaws.com:1337` +
                  post.coverImage.url
                }
                date={post.date}
                author={post.author}
              />
              <PostBody content={htmlContent} />
            </article>
          </>
        )}
      </Container>
    </Layout>
  );
}

export async function getStaticProps({ params }) {
  const queryResponse = await fetchGraphql(`
  query {
    blogPosts(where: {slug: "${params.slug}"}) {
      id
      title
      coverImage{
        url
      }
      date
      author {
        name
      }
      slug
      excerpt
      content
    }
  }
  `);

  const post = queryResponse.data.blogPosts[0];
  const content = await markdownToHtml(post.content || "");

  return {
    props: {
      post: {
        ...post,
        content,
        rawMarkdownBody: post.content,
      },
    },
  };
}

export async function getStaticPaths() {
  const queryResponse = await fetchGraphql(`
  query {
    blogPosts {
      slug
    }
  }
  `);
  const blogPosts = queryResponse.data.blogPosts;

  return {
    paths: blogPosts.map((posts) => {
      return {
        params: {
          slug: posts.slug,
        },
      };
    }),
    fallback: false,
  };
}
