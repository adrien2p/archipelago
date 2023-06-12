import { Express, Handler } from 'express';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { default as pino } from 'pino';

const logger = pino({
  timestamp: false,
  base: null,
  formatters: {
    level() {
      return { level: undefined };
    },
  },
});

type RouteDescriptor = {
  absolutePath: string;
  relativePath: string;
  route: string;
  handlers?: Array<{ verb: string; handler: Handler }>;
}

/* eslint-disable no-unused-vars */
enum RouteVerbs {
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

const pathSegmentReplacer = {
  '\\[\\.\\.\\.\\]': () => `*`,
  '\\[(\\w+)?': (param?: string) => `:${param}`,
  '\\]': () => ``,
};

const routesMap = new Map<string, RouteDescriptor>();

/**
 * Take care of replacing the special path segments
 * to an express specific path segment
 *
 * @param {string} route
 * @return {string}
 *
 * @example
 * /admin/orders/[id]/index.ts => /admin/orders/:id/index.ts
 */
function parseRoute(route: string): string {
  for (const [searchFor, replacedByFn] of Object.entries(pathSegmentReplacer)) {
    const replacer = new RegExp(searchFor, 'g');

    const matches = route.matchAll(replacer);
    for (const match of matches) {
      route = route.replace(match[0], replacedByFn(match?.[1]));
    }

    const extension = extname(route);
    if (extension) {
      route = route.replace(extension, '');
    }
  }

  return route;
}

/**
 * Load the file content from a descriptor and retrieve the verbs and handlers
 * to be assigned to the descriptor
 *
 * @return {Promise<void>}
 */
async function retrieveHandlers(): Promise<void> {
  await Promise.all(
      [...routesMap.values()].map(async (descriptor) => {
        const absolutePath = descriptor.absolutePath;
        const foundHandlers: string[] = [];
        return await import(absolutePath)
            .then((imp) => {
              for (const verb in RouteVerbs) {
                if (!imp[verb]) {
                  continue;
                }

                if (!descriptor.handlers) {
                  descriptor.handlers = [];
                }

                foundHandlers.push(verb);

                descriptor.handlers.push({
                  verb,
                  handler: imp[verb],
                });

                routesMap.set(absolutePath, descriptor);
              }
            }).finally(() => {
              logger.info(
                  `Loading handlers from ${descriptor.relativePath} ` +
              `(${foundHandlers.length} found - ${foundHandlers.join(', ')})`,
              );
            });
      }),
  );
}

/**
 * Walks through a directory and returns all files in the directory recursively
 *
 * @param {string} dirPath
 * @param {string?} rootPath
 * @return {Promise<void>}
 */
async function walkThrough(
    dirPath: string,
    rootPath?: string,
): Promise<void> {
  await Promise.all(
      await readdir(dirPath, { withFileTypes: true })
          .then((entries) => entries.map((entry) => {
            let childPath = join(dirPath, entry.name);

            if (entry.isDirectory()) {
              return [
                walkThrough(childPath, rootPath ?? dirPath),
              ];
            }

            const descriptor = {
              absolutePath: childPath,
              relativePath: '',
              route: '',
              handlers: [],
            };

            routesMap.set(childPath, descriptor);

            // Remove the rootPath from the childPath
            if (rootPath) {
              childPath = childPath.replace(rootPath, '');
            }

            logger.info(`Found file ${childPath}`);

            // File path without the root path
            descriptor.relativePath = childPath;

            // The path on which the route will be registered on
            let routeToParse = childPath;

            const pathSegments = childPath.split('/');
            const lastSegment = pathSegments[pathSegments.length - 1];

            if (lastSegment.startsWith('index')) {
              pathSegments.pop();
              routeToParse = pathSegments.join('/');
            }

            descriptor.route = parseRoute(routeToParse);
          }).flat(Infinity)),
  );
}

/**
 * Register the routes to the express app
 *
 * @param {Express} app
 * @return {void}
 */
function registerRouter(app: Express) {
  for (const descriptor of routesMap.values()) {
    if (!descriptor.handlers?.length) {
      logger.info(
          `Skipping route ${descriptor.route}. ` +
        `No handlers found for ${descriptor.relativePath}`,
      );
    }

    for (const handler of descriptor.handlers ?? []) {
      logger.info(
          `Registering route ${handler.verb} ${descriptor.route}`,
      );

      (app as any)[handler.verb.toLowerCase()](
          descriptor.route,
          handler.handler,
      );
    }
  }
}

export async function loadRoutes(app: Express, rootDir: string) {
  const start = performance.now();

  logger.info(`Loading routes from ${rootDir}`);

  await walkThrough(rootDir);
  await retrieveHandlers();
  await registerRouter(app);

  const end = performance.now();
  const timeSpent = (end - start).toFixed(3);
  logger.info(`Routes loaded in ${timeSpent} ms`);

  return app;
}
