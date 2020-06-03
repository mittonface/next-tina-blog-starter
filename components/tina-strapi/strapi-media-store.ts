import { Media, MediaStore, MediaUploadOptions } from "@tinacms/media";
import { STRAPI_URL } from "./tina-strapi-client";
import axios from "axios";

export class StrapiMediaStore implements MediaStore {
  accept = "*";

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    const uploaded: Media[] = [];
    let formData: FormData;

    for (const { file, directory } of files) {
      console.log("We got a file");
      formData = new FormData();
      formData.append("files", file);
      axios.post(STRAPI_URL + "/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    return uploaded;
  }
}
