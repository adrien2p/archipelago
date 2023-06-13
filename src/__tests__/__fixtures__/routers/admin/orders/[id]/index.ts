import { Request, Response } from 'express';

export const getAdminOrdersIdMock = jest.fn();

export async function GET(req: Request, res: Response): Promise<void> {
    getAdminOrdersIdMock();
    res.send('hello world');
}

export const config = {
    routes: [{
        method: 'get',
        handlers: [GET],
    }],
};
