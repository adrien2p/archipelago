/* eslint-disable no-unused-vars */
export enum RouteVerbs {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  ALL = 'ALL',
}
/* eslint-enable no-unused-vars */

export type RouteConfig = {
  method: RouteVerbs;
  handlers: ((...args: unknown[]) => Promise<unknown>)[];
}

export type Config = {
  ignore?: boolean;
  routes?: RouteConfig[];
}

export type RouteDescriptor<TConfig = Record<string, unknown>> = {
  absolutePath: string;
  relativePath: string;
  route: string;
  config?: TConfig & Config
}

export type OnRouteLoadingHook<TConfig> = (
  descriptor: RouteDescriptor<TConfig>
) => Promise<void>;
