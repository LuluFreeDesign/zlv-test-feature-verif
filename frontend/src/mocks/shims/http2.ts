/**
 * Browser shim for Node's `node:http2` / `http2` module.
 *
 * The MSW handlers only ever read `constants.HTTP_STATUS_*` to build their
 * responses. In the browser demo build we cannot import the real Node module,
 * so we expose just the status-code constants the handlers reference (plus a
 * few common extras for safety).
 *
 * This file is aliased in `vite.config.mts` for non-test builds only; in tests
 * the real `node:http2` is used.
 */
export const constants = {
  HTTP_STATUS_OK: 200,
  HTTP_STATUS_CREATED: 201,
  HTTP_STATUS_ACCEPTED: 202,
  HTTP_STATUS_NO_CONTENT: 204,
  HTTP_STATUS_PARTIAL_CONTENT: 206,
  HTTP_STATUS_BAD_REQUEST: 400,
  HTTP_STATUS_UNAUTHORIZED: 401,
  HTTP_STATUS_FORBIDDEN: 403,
  HTTP_STATUS_NOT_FOUND: 404,
  HTTP_STATUS_METHOD_NOT_ALLOWED: 405,
  HTTP_STATUS_CONFLICT: 409,
  HTTP_STATUS_GONE: 410,
  HTTP_STATUS_UNPROCESSABLE_ENTITY: 422,
  HTTP_STATUS_INTERNAL_SERVER_ERROR: 500
} as const;

export default { constants };
