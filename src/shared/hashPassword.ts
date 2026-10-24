import bcrypt from 'bcrypt';
import config from '../config';

const HashPassword = async (plainPassword: string): Promise<string> =>
  await bcrypt.hash(plainPassword, config.bcrypt_salt_rounds as string);

export default HashPassword;
