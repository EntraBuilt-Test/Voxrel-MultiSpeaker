import { IUser } from '@/types/user.interface.js';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
      file?: Express.Multer.File;
      files?: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;
    }
    export namespace Multer {
      export interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

export {};
