import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { DeploymentEvent, Settings } from '~/utils/types';
import { getSettings } from '../utils/settings';

export default defineEventHandler(async (event) => {
  try {
    // Verify admin access
    const auth = getHeader(event, 'Authorization');
    if (!auth?.startsWith('Bearer ') || auth.replace('Bearer ', '') !== 'admin-token') {
      throw createError({
        statusCode: 403,
        message: 'Forbidden: Admin access required'
      });
    }
    
    const body = await readBody(event);
    const { name, hostId, repositoryId, playbookId } = body;
    
    if (!name || !repositoryId || !playbookId) {
      throw createError({
        statusCode: 400,
        message: 'Missing required parameters: name, repositoryId, and playbookId'
      });
    }
    
    // Get settings to find host and repository details
    const settings = await getSettings();
    const repository = settings.repositories.find(r => r.id === repositoryId);
    
    if (!repository) {
      throw createError({
        statusCode: 404,
        message: 'Repository not found'
      });
    }
    
    // Determine which hosts to deploy to
    const hostsToDeployTo = hostId === 'all' 
      ? settings.hosts 
      : settings.hosts.filter(h => h.id === hostId);
    
    if (hostsToDeployTo.length === 0) {
      throw createError({
        statusCode: 404,
        message: 'No valid hosts found for deployment'
      });
    }
    
    // Create logs directory if it doesn't exist
    const logsDir = path.resolve('logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    // Generate deployment ID and timestamp
    const deploymentId = Date.now().toString();
    const timestamp = new Date().toISOString();
    
    // Create a single log file per deployment
    const logFileName = `${deploymentId}.log`;
    const logFilePath = path.join(logsDir, logFileName);
    
    // Initialize log file with header
    const initialLog = [
      `Deployment started at ${timestamp}`,
      `Name: ${name}`,
      `Repository: ${repository.name}`,
      `Hosts: ${hostsToDeployTo.map(h => h.name).join(', ')}`,
      `Playbook: ${playbookId}`,
      '---\n'
    ].join('\n');
    
    await fs.writeFile(logFilePath, initialLog);
    
    // Deploy to each host sequentially
    const deploymentResults = [];
    for (const host of hostsToDeployTo) {
      // Create log file name for this host
      await fs.appendFile(logFilePath, `\nDeploying to host: ${host.name}\n`);
      
      // Initialize deployment event for this host
      const deploymentEvent: DeploymentEvent = {
        id: deploymentId,
        name,
        timestamp,
        repository: repositoryId,
        hostId: host.id,
        status: 'Pending',
        logs: [],
        logFile: logFileName
      };
    
      try {
        // Find playbook file
        const playbooksDir = path.resolve('playbooks');
        const files = await fs.readdir(playbooksDir);
        let playbookPath = '';
        
        for (const file of files) {
          if (!file.endsWith('.sh')) continue;
          
          const filePath = path.join(playbooksDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          const metadataMatch = content.match(/^#\s*METADATA:\s*({[\s\S]*?})/m);
          if (!metadataMatch) continue;
          
          try {
            const metadata = JSON.parse(metadataMatch[1]);
            if (metadata.id === playbookId) {
              playbookPath = filePath;
              break;
            }
          } catch (error) {
            continue;
          }
        }
        
        if (!playbookPath) {
          throw new Error('Playbook not found');
        }
        
        // Make playbook executable
        await fs.chmod(playbookPath, '755');
        
        // Execute playbook
        const env = {
          ...process.env,
          REPOSITORY_ID: repositoryId,
          HOST_ID: host.id,
          TIMESTAMP: timestamp
        };
        
        const output = execSync(`"${playbookPath}"`, {
          env,
          encoding: 'utf-8'
        });
        
        // Write logs to file
        await fs.writeFile(logFilePath, deploymentEvent.logs.join('\n') + '\n' + output);
        
        // Update deployment status with success
        deploymentEvent.status = 'Success';
        deploymentEvent.logs.push(
          'Output:',
          ...output.split('\n'),
          `Deployment completed successfully at ${new Date().toISOString()}`
        );
      } catch (error) {
        // Update deployment status with failure
        deploymentEvent.status = 'Failed';
        deploymentEvent.logs.push(
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          `Deployment failed at ${new Date().toISOString()}`
        );
      }
      
      deploymentResults.push(deploymentEvent);
    }
      
    return {
      success: true,
      deployment: deploymentResults[0]
    };
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Deployment failed'
    });
  }
});