import { promises as fs } from 'fs';
import path from 'path';
import { getHostHistory } from '~/utils/fileSystem';

export default defineEventHandler(async (event) => {
  try {
    // Check authorization
    const auth = getHeader(event, 'Authorization');
    if (!auth?.startsWith('Bearer ') || auth.replace('Bearer ', '') !== 'admin-token') {
      throw createError({
        statusCode: 403,
        message: 'Forbidden: Admin access required'
      });
    }

    const hostId = getRouterParam(event, 'hostId');
    const eventId = getRouterParam(event, 'eventId');
    
    if (!hostId || !eventId) {
      throw createError({
        statusCode: 400,
        message: 'Missing required parameters: hostId and eventId'
      });
    }

    // Delete log file if it exists
    const logFile = path.resolve(`logs/${hostId}_${eventId}.log`);
    try {
      await fs.unlink(logFile);
    } catch (error) {
      // Ignore error if file doesn't exist
      console.log('Log file not found:', logFile);
    }

    // Remove event from history
    const historyFile = path.resolve(`history/${hostId}.json`);
    const history = await getHostHistory(hostId);
    const updatedHistory = history.filter(event => event.id !== eventId);
    await fs.writeFile(historyFile, JSON.stringify(updatedHistory, null, 2));

    return {
      success: true,
      message: 'Log deleted successfully'
    };
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete log'
    });
  }
});