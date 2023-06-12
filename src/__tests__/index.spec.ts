import { resolve } from 'path';
import { default as express } from 'express';
import { loadRoutes } from '../index';

describe('loadRouter', function() {
  const app = express();

  it('should test', async function() {
    const rootDir = resolve(__dirname, '__fixtures__/routers');
    await loadRoutes(app, rootDir);
  });
});
