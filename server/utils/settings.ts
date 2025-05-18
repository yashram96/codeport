import { promises as fs } from 'fs';
import path from 'path';
import type { Settings } from '~/utils/types';

// Check if file exists
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getSettings = async (): Promise<Settings> => {
  try {
    const settingsFile = path.resolve('settings.json');
    const exists = await fileExists(settingsFile);
    
    if (!exists) {
      const defaultSettings: Settings = {
        repositories: [],
        hosts: [],
        scripts: []
      };
      
      await fs.writeFile(settingsFile, JSON.stringify(defaultSettings, null, 2));
      return defaultSettings;
    }
    
    const data = await fs.readFile(settingsFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading settings:', error);
    throw error;
  }
};

export const writeSettings = async (settings: Settings): Promise<void> => {
  try {
    const settingsFile = path.resolve('settings.json');
    await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error writing settings:', error);
    throw error;
  }
};