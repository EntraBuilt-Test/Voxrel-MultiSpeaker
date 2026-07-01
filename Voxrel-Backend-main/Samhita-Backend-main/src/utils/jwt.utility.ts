import jwt from 'jsonwebtoken';
import { IUser } from '@/types/user.interface.js';
import { appconfig } from '@/config/config.js';

interface TokenPayload {
  _id: string;
  email: string;
  role: string;
}

export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, appconfig.jwt.secret, {
    expiresIn: appconfig.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    _id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, appconfig.jwt.secret, {
    expiresIn: appconfig.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, appconfig.jwt.secret) as TokenPayload;
};
