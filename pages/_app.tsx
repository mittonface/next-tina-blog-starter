import "../styles/index.css";
import { withTina, TinaCMS, TinaProvider } from "tinacms";
import { TinaStrapiClient } from "../components/tina-strapi/tina-strapi-client";
import { StrapiProvider } from "../components/tina-strapi/StrapiProvider";
import { useStrapiEditing } from "../components/tina-strapi/use-strapi-editing";

function MyApp({ Component, pageProps }) {
  const cms = new TinaCMS({
    apis: {
      strapi: new TinaStrapiClient(),
    },
  });

  return (
    <TinaProvider cms={cms}>
      <StrapiProvider
        editMode={true}
        enterEditMode={enterEditMode}
        exitEditMode={exitEditMode}
      >
        <EditLink editMode={true} />
        <Component {...pageProps} />
      </StrapiProvider>
    </TinaProvider>
  );
}
const enterEditMode = () => {
  return fetch(`/api/preview`).then(() => {
    window.location.href = window.location.pathname;
  });
};

const exitEditMode = () => {
  return fetch(`/api/reset-preview`).then(() => {
    window.location.reload();
  });
};

export interface EditLinkProps {
  editMode: boolean;
}
export const EditLink = ({ editMode }: EditLinkProps) => {
  const strapi = useStrapiEditing();
  return (
    <button onClick={editMode ? strapi.exitEditMode : strapi.enterEditMode}>
      {editMode ? "Exit Edit Mode" : "Edit This Site"}
    </button>
  );
};
export default MyApp;
