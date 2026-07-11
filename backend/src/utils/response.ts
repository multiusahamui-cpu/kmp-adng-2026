import { Response } from 'express';

export const successResponse = (res: any, data: any, message: string = 'Success', code: number = 200) => {
  return res.status(code).json({
    status: true,
    message,
    data,
  });
};

export const errorResponse = (res: any, message: string = 'Internal Server Error', code: number = 500, errors?: any) => {
  return res.status(code).json({
    status: false,
    message,
    errors,
  });
};