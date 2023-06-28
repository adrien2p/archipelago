import { NextFunction, Request, Response } from 'express';

export const getAdminMiddlewareMock = jest.fn();
export const postAdminMiddlewareMock = jest.fn();

export async function getAdminMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    getAdminMiddlewareMock();
    next();
}

export async function postAdminMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    postAdminMiddlewareMock();
    next();
}

export const config = {
    routes: [{
        method: 'get',
        handlers: [getAdminMiddleware],
    }, {
        method: 'post',
        handlers: [postAdminMiddleware],
    }],
};
