import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { Repository, Host, Settings, DeploymentEvent } from './types';

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

// Write settings
export const writeSettings = async (settings: Settings): Promise<void> => {
  try {
    const settingsFile = path.resolve('settings.json');
    await fs.writeFile(settingsFile, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error writing settings:', error);
    throw error;
  }
};

export const getSettings = async (): Promise<Settings> => {
  try {
    const settingsFile = path.resolve('settings.json');
    const exists = await fileExists(settingsFile);
    
    if (!exists) {
      // Create default settings if file doesn't exist
      const defaultSettings: Settings = {
        hosts: [
        ]
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

export const addDeploymentEvent = async (
  hostId: string,
  repositoryId: string,
  status: string,
  logs: string[] = []
): Promise<DeploymentEvent> => {
  try {
    const historyDir = path.resolve('history');
    await ensureDir(historyDir);
    
    const historyFile = path.join(historyDir, `${hostId}.json`);
    let history: DeploymentEvent[] = [];
    
    if (await fileExists(historyFile)) {
      const data = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(data);
    }
    
    const event: DeploymentEvent = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      repository: repositoryId,
      status,
      logs
    };
    
    history.unshift(event);
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));
    
    return event;
  } catch (error) {
    console.error(`Error adding deployment event for host ${hostId}:`, error);
    throw error;
  }
};
export const executeDeployment = async (
  hostId: string,
  repositoryId: string
): Promise<DeploymentEvent> => {
  try {
    // Create deployment entry
    const deployEvent = await addDeploymentEvent(hostId, repositoryId, 'Pending');
    
    // Get settings
    const settings = await getSettings();
    const host = settings.hosts.find(h => h.id === hostId);
    const script = settings.scripts.find(s => s.id === host?.scripts[0]);
    
    if (!host || !script) {
      throw new Error(`Host ${hostId} not found in settings`);
    }
    
    // Ensure scripts directory exists
    const scriptsDir = path.resolve('deploy-scripts');
    await fs.ensureDir(scriptsDir);
    
    // Ensure the script exists
    const scriptPath = path.resolve(script.path);
    const scriptExists = await fs.pathExists(scriptPath);
    
    if (!scriptExists) {
      // Create placeholder script
      const scriptContent = `#!/bin/bash
echo "Deploying repository ${repositoryId} to host ${hostId}"
echo "This is a placeholder script"
# Add your deployment logic here
exit 0`;
      
      await fs.writeFile(scriptPath, scriptContent);
      await fs.chmod(scriptPath, '755'); // Make executable
    }
    
    // Execute the script asynchronously
    try {
      // Create a log file
      const logDir = path.resolve('logs');
      await ensureDir(logDir);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFileName = `${hostId}_${timestamp}.log`;
      const logFile = path.join(logDir, logFileName);
      
      // Write initial log entry
      await fs.writeFile(logFile, `Deployment started at ${new Date().toISOString()}\n`);
      
      // Execute the script
      const cmd = `${scriptPath} ${repositoryId} >> ${logFile} 2>&1`;
      execSync(cmd);
      await fs.appendFile(logFile, `Repository: ${repositoryId}\n`);
      
      await fs.appendFile(logFile, `\nDeployment completed successfully at ${new Date().toISOString()}\n`);
      
      return { ...deployEvent, status: 'Success' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Deployment execution error:', errorMessage);
      
      // Update status to failed
      await updateDeploymentStatus(
        hostId, 
        deployEvent.id, 
        'Failed', 
        [`Deployment failed: ${errorMessage}`]
      );
      
      return { ...deployEvent, status: 'Failed' };
    }
  } catch (error) {
    console.error(`Error executing deployment for host ${hostId}, repository ${repositoryId}:`, error);
    throw error;
  }
};

export const updateDeploymentStatus = async (
  hostId: string,
  eventId: string,
  status: string,
  logs: string[] = []
): Promise<void> => {
  try {
    const historyFile = path.join(path.resolve('history'), `${hostId}.json`);
    const history = await fs.readFile(historyFile, 'utf-8');
    const events = JSON.parse(history);
    
    const eventIndex = events.findIndex((event: DeploymentEvent) => event.id === eventId);
    if (eventIndex !== -1) {
      events[eventIndex].status = status;
      events[eventIndex].logs = [...events[eventIndex].logs, ...logs];
      
      await fs.writeFile(historyFile, JSON.stringify(events, null, 2));
    }
  } catch (error) {
    console.error(`Error updating deployment status for host ${hostId}, event ${eventId}:`, error);
    throw error;
  }
};
export const getDeploymentLogs = async (hostId: string, eventId: string): Promise<string[]> => {
  try {
    const historyFile = path.join(path.resolve('history'), `${hostId}.json`);
    const exists = await fileExists(historyFile);
    
    if (!exists) {
      return ['No logs available'];
    }
    
    const history = await fs.readFile(historyFile, 'utf-8');
    const events = JSON.parse(history);
    
    const event = events.find((e: DeploymentEvent) => e.id === eventId);
    return event ? event.logs : ['No logs available'];
  } catch (error) {
    console.error(`Error reading logs for host ${hostId}, event ${eventId}:`, error);
    return ['Error reading logs'];
  }
};