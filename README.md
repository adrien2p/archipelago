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
    routesPath: './routes'
  });
})();
```

or using top level await

```ts
import express from 'express';
import archipelago from 'archipelago';

const app = express();
await archipelago(app, {
   routesPath: './routes'
});
```

## Documentation

### Configuration

Each route file contains a config object that is exported to be loaded in the router.
This config object contains the following properties:
- routes: an array of route descriptors (here)[./src/types.ts#L14]
- ignore: a boolean to ignore the file in case you want to use it to store other functions or utils (here)[./src/types.ts#L19]

### Defining routes

The routes will be built based on the path of the file.
For example, if you have a file in `./routes/users.js`, the route will be `/users`.

The example below are using the `GET` verb but, you can use any verb you want.

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
  routesPath: './routes',
  onRouteLoading,
});
```

# Contribute

Contributions are welcome! You can look at the contribution [guidelines](./CONTRIBUTING.md)

[![-----------------------------------------------------](https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cloudy.png)](#like-my-work-heartbeat)

# Like my work? :heartbeat:

This project needs a :star: from you.
If you really like our projects, do not hesitate to back us <a href="https://github.com/sponsors/adrien2p"><img alt="sponsor" src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" height="20"/></a>