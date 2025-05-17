import fs from 'fs-extra';
import path from 'path';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
  try {
    const { username, password } = await readBody(event);
    
    if (!username || !password) {
      return createError({
        statusCode: 400,
        message: 'Username and password are required'
      });
    }

    // Read auth config
    const authConfigPath = path.resolve('config/auth.json');
    const authConfig = await fs.readJson(authConfigPath);

    // Check admin credentials
    if (username === authConfig.write.admin.username) {
      const isValidPassword = await bcrypt.compare(password, authConfig.write.admin.hashedPassword);
      if (isValidPassword) {
        return {
          token: 'admin-token',
          role: 'admin'
        };
      }
    }
    
    // Check readonly credentials
    if (username === authConfig.readonly.username) {
      const isValidPassword = await bcrypt.compare(password, authConfig.readonly.hashedPassword);
      if (isValidPassword) {
        return {
          token: 'readonly-token',
          role: 'readonly'
        };
      }
    }
    
    return createError({
      statusCode: 401,
      message: 'Invalid credentials'
    });
  } catch (error) {
    console.error('Login error:', error);
    return createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});