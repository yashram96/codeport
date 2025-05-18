import { promises as fs } from 'fs';
import path from 'path';
import type { Repository, DeploymentEvent, Host } from '~/utils/types';

// Ensure directory exists
const ensureDir = async (dirPath: string): Promise<void> => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Check if file exists
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

export const getHostHistory = async (hostId: string): Promise<DeploymentEvent[]> => {
  try {
    const historyDir = path.resolve('history');
    await ensureDir(historyDir);
    
    const historyFile = path.join(historyDir, `${hostId}.json`);
    const exists = await fileExists(historyFile);
    
    if (!exists) {
      await fs.writeFile(historyFile, '[]');
      return [];
    }
    
    const data = await fs.readFile(historyFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading history for host ${hostId}:`, error);
    return [];
  }
};

export const recordDeploymentEvent = async (
  hostId: string,
  repository: Repository, 
  host: Host,
  script: string
): Promise<DeploymentEvent> => {
  try {
    const historyDir = path.resolve('history');
    await ensureDir(historyDir);
    
    // Generate a unique deployment ID
    const deploymentId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create a descriptive log filename
    const logFileName = `${host.name}_${repository.name}_${new Date().toISOString().split('T')[0]}_${deploymentId}.log`;
    const logFilePath = path.join(path.resolve('logs'), logFileName);
    
    // Ensure logs directory exists
    await ensureDir(path.resolve('logs'));
    
    const historyFile = path.join(historyDir, `${hostId}.json`);
    let history: DeploymentEvent[] = [];
    
    if (await fileExists(historyFile)) {
      const data = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(data);
    }
    
    const event: DeploymentEvent = {
      id: deploymentId,
      timestamp: new Date().toISOString(),
      repository: repository,
      status: 'Pending',
      logs: [],
      logs: [],
      logFile: `${hostId}_${Date.now()}.log`
    };
    
    history.unshift(event);
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    
    return event;
  } catch (error) {
    console.error(`Error recording deployment event:`, error);
    throw error;
  }
};

export const updateDeploymentStatus = async (
  hostId: string,
  eventId: string,
  status: 'Pending' | 'Success' | 'Failed',
  logs?: string[]
): Promise<void> => {
  try {
    const historyFile = path.join(path.resolve('history'), `${hostId}.json`);
    const data = await fs.readFile(historyFile, 'utf-8');
    const history = JSON.parse(data);
    
    const eventIndex = history.findIndex(event => event.id === eventId);
    if (eventIndex !== -1) {
      history[eventIndex].status = status;
      
      if (logs) {
        history[eventIndex].logs = [...history[eventIndex].logs, ...logs];
      }
      
      await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    }
  } catch (error) {
    console.error(`Error updating deployment status for host ${hostId}, event ${eventId}:`, error);
    throw error;
  }
};