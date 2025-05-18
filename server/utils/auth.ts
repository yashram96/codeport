import fs from 'fs-extra';
import path from 'path';

interface AuthConfig {
  write: {
    admin: {
      username: string;
      hashedPassword: string;
    };
  };
  readonly: {
    username: string;
    hashedPassword: string;
  };
}

export const getAuthConfig = async (): Promise<AuthConfig> => {
  try {
    const authConfigPath = path.resolve('config/auth.json');
    return await fs.readJson(authConfigPath);
  } catch (error) {
    console.error('Error reading auth config:', error);
    throw error;
  }
};