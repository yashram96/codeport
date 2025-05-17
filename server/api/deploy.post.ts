import { executeDeployment } from '~/utils/fileSystem';

export default defineEventHandler(async (event) => {
  try {
    // Get user role from headers
    const auth = getHeader(event, 'Authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return createError({
        statusCode: 401,
        message: 'Unauthorized'
      });
    }
    
    const token = auth.replace('Bearer ', '');
    const role = token === 'admin-token' ? 'admin' : (token === 'readonly-token' ? 'readonly' : null);
    
    if (!role || role !== 'admin') {
      return createError({
        statusCode: 403,
        message: 'Forbidden: Admin access required'
      });
    }
    
    // Get request body
    const body = await readBody(event);
    const { hostId, repositoryId } = body;
    
    if (!hostId || !repositoryId) {
      return createError({
        statusCode: 400,
        message: 'Missing required parameters: hostId and repositoryId'
      });
    }
    
    // Execute deployment
    const result = await executeDeployment(hostId, repositoryId);
    
    return {
      success: true,
      deployment: result
    };
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Deployment failed: ${error.message}`
    });
  }
});