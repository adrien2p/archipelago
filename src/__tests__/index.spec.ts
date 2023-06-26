import http from 'http';
import { resolve } from 'path';
import request from 'supertest';
import express from 'express';
import archipelago from '../index';
import {
    getAdminOrdersIdMock,
} from './__fixtures__/routers/admin/orders/[id]';
import { GET, POST } from './__fixtures__/routers/admin/[...]';

const hookMock = jest.fn();

describe('loadRouter', function() {
    const app = express();
    const server = http.createServer(app);

    beforeAll(async function() {
        await app.listen(3000);
        const rootDir = resolve(__dirname, '__fixtures__/routers');
        await archipelago(app, rootDir, hookMock);
    });

    afterAll(async function() {
        server.close();
    });

    it('should call route loading hook', async function() {
        expect(hookMock).toHaveBeenCalled();
        expect(hookMock).toHaveBeenCalledTimes(8);
        expect(hookMock).toHaveBeenNthCalledWith(1, {
            // eslint-disable-next-line max-len
            'absolutePath': __dirname + '/__fixtures__/routers/admin/[...].ts',
            'config': {
                'routes': expect.arrayContaining([
                    {
                        'handlers': [GET],
                        'method': 'get',
                    },
                    {
                        'handlers': [POST],
                        'method': 'post',
                    },
                ]),
            },
            'relativePath': '/admin/[...].ts',
            'route': '/admin/*',
        });
        expect(hookMock).toHaveBeenNthCalledWith(2, {
            // eslint-disable-next-line max-len
            'absolutePath': __dirname + '/__fixtures__/routers/admin/index.ts',
            'config': undefined,
            'relativePath': '/admin/index.ts',
            'route': '/admin',
        });
    });

    it('should call the admin/order/:id route', async function() {
        await request(server).get('/admin/orders/1000')
            .expect(200)
            .expect('hello world');

        expect(getAdminOrdersIdMock).toHaveBeenCalled();
    });
});
