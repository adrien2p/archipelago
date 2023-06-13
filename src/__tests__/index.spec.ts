import http from 'http';
import { resolve } from 'path';
import request from 'supertest';
import express from 'express';
import { loadRoutes } from '../index';
import { getAdminOrdersIdMock } from './__fixtures__/routers/admin/orders/[id]';

describe('loadRouter', function() {
    const app = express();
    const server = http.createServer(app);

    beforeAll(async function() {
        await app.listen(3000);
        const rootDir = resolve(__dirname, '__fixtures__/routers');
        await loadRoutes(app, rootDir);
    });

    afterAll(async function() {
        server.close();
    });

    it('should test', async function() {
        await request(server).get('/admin/orders/1000')
            .expect(200)
            .expect('hello world');
        expect(getAdminOrdersIdMock).toHaveBeenCalled();
    });
});
