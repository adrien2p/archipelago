import { Express } from 'express';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';
import { default as pino } from 'pino';
import {
    Config,
    OnRouteLoadingHook,
    RouteConfig,
    RouteDescriptor,
} from './types';

const logger = pino({
    timestamp: false,
    base: null,
    formatters: {
        level() {
            return { level: undefined };
        },
    },
});

const pathSegmentReplacer = {
    '\\[\\.\\.\\.\\]': () => `*`,
    '\\[(\\w+)?': (param?: string) => `:${param}`,
    '\\]': () => ``,
};

const routesMap = new Map<string, RouteDescriptor>();

/**
 * Validate the route config and display a log info if
 * it should be ignored or skipped.
 *
 * @param {RouteDescriptor} descriptor
 * @param {Config} config
 * @param {boolean} strict If set to true, will throw an error if no
 * config is found
 *
 * @return {void}
 */
function validateRouteConfig(
    descriptor: RouteDescriptor,
    config?: Config,
    strict?: boolean,
): void {
    if (!config) {
        if (strict) {
            throw new Error(
                `Unable to load the routes from ` +
            `${descriptor.relativePath}. ` +
            `No config found. Did you export a config object?`,
            );
        } else {
            logger.info(
                `Skipping loading handlers from ` +
            `${descriptor.relativePath}. ` +
            `No config found. Did you export a config object?`,
            );
        }
    }

    if (config?.ignore) {
        logger.info(
            `Skipping loading handlers from ` +
      `${descriptor.relativePath}. ` +
      `Ignore flag set to true.`,
        );
    }
}

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
 * @param {boolean} strict If set to true, then every file must export a config
 *
 * @return {Promise<void>}
 */
async function retrieveFilesRoutesConfig({
    strict,
}: {
  strict?: boolean
}): Promise<void> {
    await Promise.all(
        [...routesMap.values()].map(async (descriptor) => {
            const absolutePath = descriptor.absolutePath;
            return await import(absolutePath)
                .then((imp) => {
                    validateRouteConfig(descriptor, imp.config, strict);

                    descriptor.config = imp.config;

                    routesMap.set(absolutePath, descriptor);
                }).finally(() => {
                    const config = descriptor.config;
                    const verbs = config?.routes
                        ?.map((route) => route.method) ?? ['none'];
                    const handlersCount = config?.routes
                        ?.map((route: RouteConfig) => route.handlers.length)
                        ?.reduce((a, b) => a + b, 0) ?? 0;

                    if (handlersCount && !config?.ignore) {
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
 *
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
 * @param {OnRouteLoadingHook<TConfig>}onRouteLoading A hook that will be called
 * when a route is being loaded
 *
 * @return {Promise<void>}
 */
async function registerRouter<TConfig>(
    app: Express,
    onRouteLoading?: OnRouteLoadingHook<TConfig>,
) {
    for (const descriptor of routesMap.values()) {
        await onRouteLoading?.(descriptor as RouteDescriptor<TConfig>);
        if (!descriptor.config?.routes?.length || descriptor.config?.ignore) {
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

/**
 * Archipelago will walk through the rootDir and load all files if they need
 * to be loaded
 *
 * @param {Express} app
 * @param {string} rootDir The directory to walk through
 * @param {OnRouteLoadingHook} onRouteLoading A hook that will be called when a
 * route is being loaded
 * @param {boolean} strict If set to true, then every file must export a config
 *
 * @return {Promise<Express>}
 */
export default async function archipelago<TConfig = unknown>(
    app: Express,
    { rootDir, onRouteLoading, strict }: {
      rootDir: string,
      onRouteLoading?: OnRouteLoadingHook<TConfig>
      strict?: boolean
    },
) {
    const start = performance.now();

    logger.info(`Loading routes from ${rootDir}`);

    await walkThrough(rootDir);
    await retrieveFilesRoutesConfig({ strict });
    await registerRouter(app, onRouteLoading);

    const end = performance.now();
    const timeSpent = (end - start).toFixed(3);
    logger.info(`Routes loaded in ${timeSpent} ms`);

    return app;
}

export * from './types';
