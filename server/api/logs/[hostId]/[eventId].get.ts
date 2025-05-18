import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  try {
    const hostId = getRouterParam(event, 'hostId');
    const eventId = getRouterParam(event, 'eventId');
    
    if (!hostId || !eventId) {
      return createError({
        statusCode: 400,
        message: 'Missing required parameters: hostId and eventId'
      });
    }
    
    // Read log file
    const logFile = path.join(path.resolve('logs'), `${eventId}.log`);
    
    try {
      const logContent = await fs.readFile(logFile, 'utf-8');
      return logContent.split('\n');
    } catch (error) {
      console.error(`Error reading log file ${logFile}:`, error);
      return ['No logs available for this deployment'];
    }
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Failed to get logs: ${error.message}`
    });
  }
}
)