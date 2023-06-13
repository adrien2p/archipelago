import { NextFunction, Request, Response } from 'express';

export async function GET(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    next();
}

export async function POST(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    next();
}

export const config = {
    routes: [{
        method: 'get',
        handlers: [GET],
    }, {
        method: 'post',
        handlers: [POST],
    }],
};
