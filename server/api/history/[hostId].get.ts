import fs from 'fs-extra';
import path from 'path';
import type { DeploymentEvent } from '~/utils/types';

const parseLogFile = async (filePath: string): Promise<DeploymentEvent | null> => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Parse metadata from first few lines
    const timestamp = lines[0].split('at ')[1];
    const name = lines[1].split('Name: ')[1];
    const repository = lines[2].split('Repository: ')[1];
    const host = lines[3].split('Host: ')[1];
    const playbook = lines[4].split('Playbook: ')[1];
    
    // Determine status from content
    let status = 'Pending';
    if (content.includes('Deployment completed successfully')) {
      status = 'Success';
    } else if (content.includes('Deployment failed')) {
      status = 'Failed';
    }
  } catch (error) {
    console.error('Error parsing log file:', error);
    return null;
  }
};

export default defineEventHandler(async (event) => {
  try {
    const hostId = getRouterParam(event, 'hostId');
    
    if (!hostId) {
      return createError({
        statusCode: 400,
        message: 'Missing required parameter: hostId'
      });
    }
    
    const logsDir = path.resolve('logs');
    await fs.ensureDir(logsDir);
    
    const files = await fs.readdir(logsDir);
    const deployments = [];
    
    // Process each log file
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const content = await fs.readFile(path.join(logsDir, file), 'utf-8');
      const lines = content.split('\n');
      
      // Extract metadata from log file
      const timestamp = lines[0].split('at ')[1];
      const name = lines[1].split('Name: ')[1];
      const repository = lines[2].split('Repository: ')[1];
      const hosts = lines[3].split('Hosts: ')[1].split(', ');
      
      // Only include deployments for the requested host
      if (hostId !== 'all' && !hosts.includes(hostId)) {
        continue;
      }
      
      // Determine status
      let status = 'Pending';
      if (content.includes('Deployment completed successfully')) {
        status = 'Success';
      } else if (content.includes('Deployment failed')) {
        status = 'Failed';
      }
      
      deployments.push({
        id: file.replace('.log', ''),
        name,
        timestamp,
        repository,
        hostId,
        status,
        logs: lines
      });
    }
    
    // Sort deployments by timestamp, newest first
    return deployments.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    throw createError({ statusCode: 500, message: error.message });
  }
});