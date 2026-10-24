import bcrypt from 'bcrypt';
import jwt, { Secret, JwtPayload, SignOptions } from 'jsonwebtoken';

export const isPasswordMatched = async (
  plainTextPassword: string,
  hashedPassword: string,
) => {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};

export const createToken = (
  jwtPayload: JwtPayload,
  secret: Secret,
  expiresIn: SignOptions['expiresIn'],
): string => {
  return jwt.sign(jwtPayload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
