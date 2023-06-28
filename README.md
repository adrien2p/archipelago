<h1 align="center">archipelago</h1>

<p align="center">
    <a href="https://github.com/adrien2p/archipelago/graphs/contributors"><img alt="Contributors" src="https://img.shields.io/github/contributors/adrien2p/archipelago.svg" height="20"/></a>
    <a href="https://github.com/adrien2p/archipelago/commits/main"><img alt="Activity" src="https://img.shields.io/github/commit-activity/m/adrien2p/archipelago?style=flat" height="20"/></a>
    <a href="https://github.com/adrien2p/archipelago/issues"><img alt="Issues" src="https://img.shields.io/github/issues/adrien2p/archipelago?style=flat" height="20"/></a>
    <a href="https://github.com/adrien2p/archipelago/blob/main/LICENSE"><img alt="Licence" src="https://img.shields.io/github/license/adrien2p/archipelago?style=flat" height="20"/></a>
    <a href="https://github.com/adrien2p/archipelago/blob/main/CONTRIBUTING.md"><img alt="Contributing" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" height="20"/></a>
    <a href="https://github.com/sponsors/adrien2p"><img alt="sponsor" src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" height="20"/></a>
</p>    

<p align="center">
  <b>File base routing system for express.js :bullettrain_side:</b></br>
</p>

<br />

- [Installation](#installation)
- [Documentation](#documentation)

## Installation

```bash
npm install archipelago
```

or if you use yarn
    
```bash
yarn add archipelago
```

### Basic usage

```ts
import express from 'express';
import archipelago from 'archipelago';

(async () => {
  const app = express();
  await archipelago(app, {
    rootDir: './routes',
    // onRouteLoading?: (descriptor) => Promise<void>
    // strict?: boolean
  });
})();
```

or using top level await

```ts
import express from 'express';
import archipelago from 'archipelago';

const app = express();
await archipelago(app, {
   rootDir: './routes'
  // onRouteLoading?: (descriptor) => Promise<void>
  // strict?: boolean
});
```

Here are the options you can pass to the `archipelago` function:
- **[required]** `rootDir`: The directory from which to load the routes
- **[optional]** `onRouteLoading`: A function that will be called before a route is loaded
- **[optional]** `strict`: A boolean to indicate if the router should throw an error if a config is not exported by a route file

## Documentation

### Defining global place for middlewares

the special directory `_middlewares` allow you to define middlewares that will be applied to the specified routes.

For example, if you want to apply a middleware to all routes in the `./routes/users` directory, you can create a file
`./routes/_middlewares/users.ts` with the following content:

```ts
export function userMiddleware(req, res, next) {
  console.log('before reaching users');
  next();
}

export const config = {
  routes: [{
    method: 'all',
    path: "/users",
    middlewares: [userMiddleware],
  }],
}
```


### Defining routes

The routes will be built based on the path of the file.
For example, if you have a file in `./routes/users.js`, the route will be `/users`.

Each route file contains a config object that is exported to be loaded in the router.
This config object contains the following properties:
- **[optional]** `routes`: an array of route descriptors. (here)[./src/types.ts#L14]
- **[optional]** `ignore`: a boolean to ignore the file in case you want to use it to store other functions or utils. (here)[./src/types.ts#L19]

**PRIORITY:**

The routes are loaded depending on their priority. The routes with the lower number (highest priority) are loaded first.
A wilcard route has a priority of Infinity. The smaller number, the higher is the priority.

#### define a simple route

```ts
// ./routes/users/index.ts
export function list(req, res) {
  res.send('Hello world');
}

export const config = {
  routes: [{
    method: 'get',
    handlers: [list],
  }],
}
```

this route will be accessible at `/users` with the `GET` method.

#### define a route with a parameter

```ts
// ./routes/users/[id].ts
export function get(req, res) {
  res.send('Hello user ' + req.params.id);
}

export const config = {
  routes: [{
    method: 'get',
    handlers: [get],
  }],
}
```

this route will be accessible at `/users/:id` with the `GET` method.

#### define a route on all sub routes

```ts
// ./routes/users/[id].ts
export function beforeGetAndList(req, res) {
  res.send(`Hello user${req.params.id ? ' ' + req.params.id : ''}`);
}

export const config: Config = {
  routes: [{
    method: 'get',
    handlers: [beforeGetAndList],
  }],
}
```

this route will be applied to `/users/*` with the `GET` method and therefore will be fired before
any subsequent route handler.

### Hook yourself before a route is loading

In some circumstances, you may want to hook yourself before a route is loading.
For example if you want to apply some extra middlewares to a route, or if you want to check
and consume the configuration for other purposes.

To do so, you can use the `onRouteLoading` hook (the type of the descriptor is available [here](./src/types.ts))

```ts
import express from 'express';
import archipelago from 'archipelago';

async function onRouteLoading(descriptor) {
  // do something with the descriptor
  // ...
  // You have access to everything the descriptor contains
  // You can find the full types here https://github.com/adrien2p/archipelago/blob/main/src/types.ts
  
  return;
}

const app = express();
await archipelago(app, {
  rootDir: './routes',
  onRouteLoading,
});
```

# Contribute

Contributions are welcome! You can look at the contribution [guidelines](./CONTRIBUTING.md)

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cloudy.png)](#like-my-work-heartbeat)

# Like my work? :heartbeat:

This project needs a :star: from you.
If you really like our projects, do not hesitate to back us <a href="https://github.com/sponsors/adrien2p"><img alt="sponsor" src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" height="20"/></a>