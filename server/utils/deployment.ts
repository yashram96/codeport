import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { Host, Repository, DeploymentEvent } from '~/utils/types';
import { recordDeploymentEvent, updateDeploymentStatus } from './history';

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

export const executeDeployment = async (
  host: Host,
  repository: Repository,
  script: { id: string; path: string }
): Promise<DeploymentEvent> => {
  try {
    // Record initial deployment event
    const deployEvent = await recordDeploymentEvent(host.id, repository, script.path);
    
    // Ensure scripts directory exists
    const scriptsDir = path.resolve('deploy-scripts');
    await ensureDir(scriptsDir);
    
    // Ensure logs directory exists
    const logDir = path.resolve('logs');
    await ensureDir(logDir);
    
    const logFile = path.join(logDir, `${host.id}_${deployEvent.id}.log`);
    const scriptPath = path.resolve(script.path);
    
    // Ensure script exists and is executable
    if (!await fileExists(scriptPath)) {
      const defaultScript = `#!/bin/bash
echo "Deploying ${repository.name} to ${host.name}"
echo "Repository URL: ${repository.url}"
echo "Timestamp: $(date)"

# Add deployment steps here
sleep 2
echo "Deployment completed successfully"
`;
      await fs.writeFile(scriptPath, defaultScript);
    }
    
    // Make script executable
    await fs.chmod(scriptPath, 0o755);
    
    try {
      // Write initial log entry
      await fs.writeFile(logFile, `Deployment started at ${new Date().toISOString()}\n`);
      
      // Execute deployment script
      const output = execSync(`"${scriptPath}" "${repository.url}"`, {
        encoding: 'utf-8'
      });
      
      // Update status and logs
      await updateDeploymentStatus(host.id, deployEvent.id, 'Success', [output]);
      await fs.appendFile(logFile, `${output}\nDeployment completed successfully\n`);
      
      return { ...deployEvent, status: 'Success' };
    } catch (error) {
      // Handle script execution error
      const errorMessage = error instanceof Error ? error.message : String(error);
      await updateDeploymentStatus(host.id, deployEvent.id, 'Failed', [errorMessage]);
      await fs.appendFile(logFile, `\nDeployment failed: ${errorMessage}\n`);
      
      return { ...deployEvent, status: 'Failed' };
    }
  } catch (error) {
    console.error('Error executing deployment:', error);
    throw error;
  }
}