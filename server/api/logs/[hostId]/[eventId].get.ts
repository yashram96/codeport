import { getDeploymentLogs } from '~/utils/fileSystem';

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
    
    const logs = await getDeploymentLogs(hostId, eventId);
    return logs;
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Failed to get logs: ${error.message}`
    });
  }
});