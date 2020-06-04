import axios from "axios";
import Cookies from "js-cookie";

export const STRAPI_JWT = "tina_strapi_jwt";
export const STRAPI_URL =
  "http://ec2-3-80-231-194.compute-1.amazonaws.com:1337";

export class TinaStrapiClient {
  authenticate() {
    axios
      .post(`${STRAPI_URL}/auth/local`, {
        identifier: "testuser",
        password: "testpassword",
      })
      .then((authData) => {
        Cookies.set(STRAPI_JWT, authData.data.jwt);
      });
  }
}
