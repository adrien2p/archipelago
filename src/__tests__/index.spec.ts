import http from 'http';
import { resolve } from 'path';
import request from 'supertest';
import express from 'express';
import archipelago from '../index';
import {
    getAdminOrdersIdMock, postAdminOrdersIdMock,
} from './__fixtures__/routers/admin/orders/[id]';
import {
    getAdminMiddlewareMock,
    postAdminMiddlewareMock,
} from './__fixtures__/routers/admin/[...]';
import { getIgnoreMock } from './__fixtures__/routers/admin/orders';

const hookMock = jest.fn();

describe('loadRouter', function() {
    const app = express();
    const server = http.createServer(app);

    beforeAll(async function() {
        await app.listen(3000);
        const rootDir = resolve(__dirname, '__fixtures__/routers');
        await archipelago(app, {
            rootDir,
            onRouteLoading: hookMock,
            strict: true,
        });
    });

    afterAll(function(done) {
        server.close(() => {
            done();
        });
    });

    afterEach(function() {
        jest.clearAllMocks();
    });

    it('should call the route loading hook', async function() {
        expect(hookMock).toHaveBeenCalled();
        expect(hookMock).toHaveBeenCalledTimes(9);
    });

    // eslint-disable-next-line max-len
    it('should call the GET admin/order/:id route has it should have been loaded', async function() {
        await request(server).get('/admin/orders/1000')
            .expect(200)
            .expect('hello world');

        expect(getAdminOrdersIdMock).toHaveBeenCalled();
        expect(getAdminMiddlewareMock).toHaveBeenCalledTimes(1);
    });

    // eslint-disable-next-line max-len
    it('should call the POST admin/order/:id route has it should have been loaded', async function() {
        await request(server).post('/admin/orders/1000')
            .expect(200)
            .expect('hello world');

        expect(postAdminOrdersIdMock).toHaveBeenCalled();
        expect(postAdminMiddlewareMock).toHaveBeenCalledTimes(1);
    });

    // eslint-disable-next-line max-len
    it('should not load the admin/order/ignore route has it has been ignored in the config', async function() {
        await request(server).get('/admin/orders')
            .expect(404);

        expect(getIgnoreMock).not.toHaveBeenCalled();
        expect(getAdminMiddlewareMock).toHaveBeenCalledTimes(1);
    });
});
