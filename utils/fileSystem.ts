import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import type { Repository, Host, Settings, DeploymentEvent } from './types';

// Write settings
export const writeSettings = async (settings: Settings): Promise<void> => {
  try {
    const settingsFile = path.resolve('settings.json');
    await fs.writeJson(settingsFile, settings, { spaces: 2 });
  } catch (error) {
    console.error('Error writing settings:', error);
    throw error;
  }
};

// Settings
export const getSettings = async (): Promise<Settings> => {
  try {
    const settingsFile = path.resolve('settings.json');
    const exists = await fs.pathExists(settingsFile);
    
    if (!exists) {
      // Create default settings if file doesn't exist
      const defaultSettings: Settings = {
        repositories: [
          { id: 'repo1', name: 'Project A', url: 'https://github.com/user/project-a' },
          { id: 'repo2', name: 'Project B', url: 'https://github.com/user/project-b' },
        ],
        hosts: [
          { id: 'host1', name: 'Production Server', scripts: ['script1'] },
          { id: 'host2', name: 'Staging Server', scripts: ['script2'] }
        ],
        scripts: [
          { id: 'script1', name: 'Production Deploy', path: './deploy-scripts/host1.sh' },
          { id: 'script2', name: 'Staging Deploy', path: './deploy-scripts/host2.sh' }
        ]
      };
      
      await fs.writeJson(settingsFile, defaultSettings, { spaces: 2 });
      return defaultSettings;
    }
    
    return await fs.readJson(settingsFile);
  } catch (error) {
    console.error('Error reading settings:', error);
    throw error;
  }
};

// Host History
export const getHostHistory = async (hostId: string): Promise<DeploymentEvent[]> => {
  try {
    const historyDir = path.resolve('history');
    await fs.ensureDir(historyDir);
    
    const historyFile = path.join(historyDir, `${hostId}.json`);
    const exists = await fs.pathExists(historyFile);
    
    if (!exists) {
      await fs.writeJson(historyFile, [], { spaces: 2 });
      return [];
    }
    
    return await fs.readJson(historyFile);
  } catch (error) {
    console.error(`Error reading history for host ${hostId}:`, error);
    return [];
  }
};

export const addDeploymentEvent = async (
  hostId: string,
  repositoryId: string,
  status: 'Pending' | 'Success' | 'Failed',
  logs: string[] = []
): Promise<DeploymentEvent> => {
  try {
    const historyDir = path.resolve('history');
    await fs.ensureDir(historyDir);
    
    const historyFile = path.join(historyDir, `${hostId}.json`);
    let history: DeploymentEvent[] = [];
    
    if (await fs.pathExists(historyFile)) {
      history = await fs.readJson(historyFile);
    }
    
    const event: DeploymentEvent = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      repository: repositoryId,
      status,
      logs
    };
    
    history.unshift(event);
    await fs.writeJson(historyFile, history, { spaces: 2 });
    
    return event;
  } catch (error) {
    console.error(`Error adding deployment event for host ${hostId}:`, error);
    throw error;
  }
};

export const updateDeploymentStatus = async (
  hostId: string,
  eventId: string,
  status: 'Pending' | 'Success' | 'Failed',
  logs: string[] = []
): Promise<void> => {
  try {
    const historyFile = path.join(path.resolve('history'), `${hostId}.json`);
    const history = await fs.readJson(historyFile);
    
    const eventIndex = history.findIndex(event => event.id === eventId);
    if (eventIndex !== -1) {
      history[eventIndex].status = status;
      
      // Append logs if any
      if (logs.length > 0) {
        history[eventIndex].logs = [...history[eventIndex].logs, ...logs];
      }
      
      await fs.writeJson(historyFile, history, { spaces: 2 });
    }
  } catch (error) {
    console.error(`Error updating deployment status for host ${hostId}, event ${eventId}:`, error);
    throw error;
  }
};

// Deployment Functions
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
      await fs.ensureDir(logDir);
      const logFile = path.join(logDir, `${hostId}_${deployEvent.id}.log`);
      
      // Write initial log entry
      await fs.writeFile(logFile, `Deployment started at ${new Date().toISOString()}\n`);
      
      // Execute the script
      const cmd = `${scriptPath} ${repositoryId} >> ${logFile} 2>&1`;
      execSync(cmd);
      
      // Update status to success
      await updateDeploymentStatus(hostId, deployEvent.id, 'Success', ['Deployment completed successfully']);
      await fs.appendFile(logFile, `\nDeployment completed successfully at ${new Date().toISOString()}\n`);
      
      return { ...deployEvent, status: 'Success' };
    } catch (error) {
      // Update status to failed
      await updateDeploymentStatus(
        hostId, 
        deployEvent.id, 
        'Failed', 
        [`Deployment failed: ${error.message || 'Unknown error'}`]
      );
      
      return { ...deployEvent, status: 'Failed' };
    }
  } catch (error) {
    console.error(`Error executing deployment for host ${hostId}, repository ${repositoryId}:`, error);
    throw error;
  }
};

// Log functions
export const getDeploymentLogs = async (hostId: string, eventId: string): Promise<string[]> => {
  try {
    const logFile = path.resolve(`logs/${hostId}_${eventId}.log`);
    const exists = await fs.pathExists(logFile);
    
    if (!exists) {
      return ['No logs available'];
    }
    
    const content = await fs.readFile(logFile, 'utf-8');
    return content.split('\n');
  } catch (error) {
    console.error(`Error reading logs for host ${hostId}, event ${eventId}:`, error);
    return ['Error reading logs'];
  }
};