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
import { type } from "os";
import { Button as TinaButton } from "@tinacms/styles";
import {
  InlineForm,
  InlineField,
  InlineText,
  useInlineForm,
  InlineBlocks,
  BlocksControls,
  InlineTextarea,
  InlineImage,
} from "react-tinacms-inline";

export function Content(props) {
  return (
    <BlocksControls index={props.index}>
      <InlineTextarea name="content" />
    </BlocksControls>
  );
}

export function Image(props) {
  return (
    <BlocksControls index={props.index}>
      <InlineImage
        name="coverImage.url"
        previewSrc={(formValues) => {
          return STRAPI_URL + get(formValues, "coverImage.url");
        }}
        uploadDir={() => {
          return `/uploads/`;
        }}
        parse={(filename) => {
          return `/uploads/${filename}`;
        }}
        format={(coverImage) => {
          return "ME OH MY/" + coverImage.url + "hi";
        }}
      >
        {() => {
          console.log(props);
          return <img src={STRAPI_URL + props.data.coverImage.url} />;
        }}
      </InlineImage>
    </BlocksControls>
  );
}
export const content_template = {
  label: "Content",
  name: "content",
  key: "content-block",
  defaultItem: {
    content: "",
  },
  fields: [],
};

export const image_template = {
  label: "Image",
  name: "image",
  key: "image-block",
  defaultItem: {
    coverImage: { url: "" },
  },
  fields: [],
};

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
      mutation UpdateBlogPost(
        $id: ID!
        $title: String
        $content: String
        $date: Date
        $blocks: JSON
      ) {
        updateBlogPost(
          input: {
            where: { id: $id }
            data: { title: $title, content: $content, date: $date, blocks: $blocks }
          }
        ) {
          blogPost {
            id
          }
        }
      }
      `;

      const response = await fetchGraphql(saveMutation, {
        id: values.id,
        title: values.title,
        content: values.rawMarkdownBody,
        date: values.date,
        blocks: values.blocks,
      });
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

      // {
      //   label: "Page Sections",
      //   name: "blocks.blocks",
      //   component: "blocks",
      //   templates: { ContentBlock, ImageBlock },
      // },
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
  let blocks = post.blocks.blocks;

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
              </Head>
              <InlineForm form={form}>
                <EditToggle />
                <PostTitle>
                  <InlineText name="title" />
                </PostTitle>
                <InlineBlocks name="blocks.blocks" blocks={PAGE_BLOCKS} />
              </InlineForm>
            </article>
          </>
        )}
      </Container>
    </Layout>
  );
}
const PAGE_BLOCKS = {
  content: {
    Component: Content,
    template: content_template,
  },
  image: {
    Component: Image,
    template: image_template,
  },
};
export function EditToggle() {
  // Access 'edit mode' controls via `useInlineForm` hook
  const { status, deactivate, activate } = useInlineForm();

  return (
    <TinaButton
      primary
      onClick={() => {
        status === "active" ? deactivate() : activate();
      }}
    >
      {status === "active" ? "Preview" : "Edit"}
    </TinaButton>
  );
}

export async function getStaticProps({ params, preview, previewData }) {
  const queryResponse = await fetchGraphql(`
  query {
    blogPosts(where: {slug: "${params.slug}"}) {
      id
      title
      blocks
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
