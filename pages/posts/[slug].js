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
import { STRAPI_URL } from "../../components/tina-strapi/tina-strapi-client";
import get from "lodash.get";

export default function Post({ post: initialPost, preview }) {
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
            where: { id: ${values.id} },
            data: { title: "${values.title}", content: """${values.rawMarkdownBody}""", date:"${values.date}", coverImage: "${values.coverImage.id}"}
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
        name: "date",
        label: "Post Date",
        component: "date",
        parse: (val) => {
          return val.format("YYYY-MM-DD");
        },
      },
      {
        name: "coverImage",
        label: "Cover Image",
        component: "image",
        previewSrc: (formValues, { input }) => {
          return STRAPI_URL + get(formValues, input.name + ".url");
        },
        uploadDir: () => {
          return `/uploads/`;
        },
        parse: (filename) => {
          const filenameParts = filename.split("?");
          return { url: `/uploads/${filenameParts[0]}`, id: filenameParts[1] };
        },
        format: (coverImage) => {
          return coverImage.url;
        },
      },
      {
        name: "rawMarkdownBody",
        label: "Content",
        component: "markdown",
      },
      ,
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
                  {post.title}| Next.js Blog Example with {CMS_NAME}
                </title>
                <meta
                  property="og:image"
                  content={STRAPI_URL + post.coverImage.url}
                />
              </Head>
              <PostHeader
                title={post.title}
                coverImage={STRAPI_URL + post.coverImage.url}
                date={post.date}
                author={post.author}
              />
              {post.coverImage.url}
              <PostBody content={htmlContent} />
            </article>
          </>
        )}
      </Container>
    </Layout>
  );
}

export async function getStaticProps({ params, preview, previewData }) {
  const queryResponse = await fetchGraphql(`
  query {
    blogPosts(where: {slug: "${params.slug}"}) {
      id
      title
      coverImage{
        id
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
  console.log(post);
  const content = await markdownToHtml(post.content || "");

  if (preview) {
    return {
      props: {
        ...previewData,
        preview,
        post: {
          ...post,
          content,
          rawMarkdownBody: post.content,
        },
      },
    };
  }

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
