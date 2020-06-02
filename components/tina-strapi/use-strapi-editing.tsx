import React from "react";

import { StrapiEditingContext } from "./StrapiEditingContext";

export function useStrapiEditing() {
  return React.useContext(StrapiEditingContext);
}
