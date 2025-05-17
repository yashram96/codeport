import { getHostHistory } from '~/utils/fileSystem';

export default defineEventHandler(async (event) => {
  try {
    const hostId = getRouterParam(event, 'hostId');
    
    if (!hostId) {
      return createError({
        statusCode: 400,
        message: 'Missing required parameter: hostId'
      });
    }
    
    const history = await getHostHistory(hostId);
    return history;
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Failed to get history: ${error.message}`
    });
  }
});