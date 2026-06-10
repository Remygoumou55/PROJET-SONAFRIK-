import { CATALOG_ERROR_MESSAGES } from "@sonafrik/types";

export class CatalogError extends Error {
  readonly code: keyof typeof CATALOG_ERROR_MESSAGES;

  constructor(code: keyof typeof CATALOG_ERROR_MESSAGES) {
    super(CATALOG_ERROR_MESSAGES[code]);
    this.name = "CatalogError";
    this.code = code;
  }
}
