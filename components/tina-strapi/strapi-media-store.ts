import { Media, MediaStore, MediaUploadOptions } from "@tinacms/media";
import { STRAPI_URL } from "./tina-strapi-client";
import axios from "axios";

export class StrapiMediaStore implements MediaStore {
  accept = "*";

  async persist(files: MediaUploadOptions[]): Promise<Media[]> {
    const uploaded: Media[] = [];

    // TODO: I think we need a way to expose arbitrary information from this persistance to the forms.
    for (const { file } of files) {
      const upload = await uploadFile(file);
      console.log(upload);
      uploaded.push({
        directory: "/uploads",
        filename:
          upload.data[0].hash + upload.data[0].ext + `?${upload.data[0].id}`, // TODO: 🤢
      });
    }

    return uploaded;
  }
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("files", file);
  const uploadResponse = await axios.post(STRAPI_URL + "/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return uploadResponse;
}
