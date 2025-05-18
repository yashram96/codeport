import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getAuthConfig } from './auth';
import type { User } from '~/utils/types';

export const getUsers = async (): Promise<User[]> => {
  try {
    const authConfig = await getAuthConfig();
    
    // Convert auth config to user format
    return [
      {
        id: 'admin',
        username: authConfig.write.admin.username,
        role: 'admin'
      },
      {
        id: 'user',
        username: authConfig.readonly.username,
        role: 'user'
      }
    ];
  } catch (error) {
    console.error('Error reading users:', error);
    throw error;
  }
};

export const updateUsers = async (users: User[]): Promise<void> => {
  // This function is now deprecated as users are managed through auth.json
  console.warn('User updates must be done through auth.json configuration');
  return Promise.resolve();
};