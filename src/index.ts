import { Express } from 'express';
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

type RouteConfig = {
  method: RouteVerbs;
  handlers: ((...args: unknown[]) => Promise<unknown>)[];
}

type RouteDescriptor<TConfig = unknown> = {
  absolutePath: string;
  relativePath: string;
  route: string;
  config?: TConfig &{
    routes: RouteConfig[];
  }
}

type OnRouteLoadingHook<TConfig> = (
  descriptor: RouteDescriptor<TConfig>
) => Promise<void>

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
    for (const config of Object.entries(pathSegmentReplacer)) {
        const [searchFor, replacedByFn] = config;
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
async function retrieveFilesRoutesConfig(): Promise<void> {
    await Promise.all(
        [...routesMap.values()].map(async (descriptor) => {
            const absolutePath = descriptor.absolutePath;
            return await import(absolutePath)
                .then((imp) => {
                    if (!imp.config) {
                        logger.info(
                            `Skipping loading handlers from ` +
                          `${descriptor.relativePath}.` +
                          `No config found.`,
                        );
                    }

                    descriptor.config = imp.config;

                    routesMap.set(absolutePath, descriptor);
                }).finally(() => {
                    const config = descriptor.config;
                    const verbs = config?.routes
                        ?.map((route) => route.method) ?? ['none'];
                    const handlersCount = config?.routes
                        ?.map((route: RouteConfig) => route.handlers.length)
                        ?.reduce((a, b) => a + b, 0) ?? 0;

                    if (handlersCount) {
                        logger.info(
                            `Loading handlers from ` +
                          `${descriptor.relativePath} ` +
                          `(${handlersCount} found - ${verbs.join(', ')})`,
                        );
                    }
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

                const descriptor: RouteDescriptor = {
                    absolutePath: childPath,
                    relativePath: '',
                    route: '',
                    config: {
                        routes: [],
                    },
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
 * @param {OnRouteLoadingHook<TConfig>}onRouteLoading
 * @return {Promise<void>}
 */
async function registerRouter<TConfig>(
    app: Express,
    onRouteLoading?: OnRouteLoadingHook<TConfig>,
) {
    for (const descriptor of routesMap.values()) {
        await onRouteLoading?.(descriptor as RouteDescriptor<TConfig>);
        if (!descriptor.config?.routes?.length) {
            continue;
        }

        for (const config of descriptor.config.routes ?? []) {
            logger.info(
                `Registering route ${config.method} ${descriptor.route}`,
            );

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (app as any)[config.method.toLowerCase()](
                descriptor.route,
                ...config.handlers,
            );
        }
    }
}

export default async function archipelago<TConfig = unknown>(
    app: Express,
    rootDir: string,
    onRouteLoading?: OnRouteLoadingHook<TConfig>,
) {
    const start = performance.now();

    logger.info(`Loading routes from ${rootDir}`);

    await walkThrough(rootDir);
    await retrieveFilesRoutesConfig();
    await registerRouter(app, onRouteLoading);

    const end = performance.now();
    const timeSpent = (end - start).toFixed(3);
    logger.info(`Routes loaded in ${timeSpent} ms`);

    return app;
}
