import { Request, Response } from 'express';

export const getIgnoreMock = jest.fn();
export function getIgnore(req: Request, res: Response) {
    getIgnoreMock();
    res.send('hello world');
}

export const config = {
    ignore: true,
    routes: [{
        method: 'get',
        handlers: [getIgnore],
    }],
};
