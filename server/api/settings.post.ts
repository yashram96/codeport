import { writeSettings } from '~/utils/fileSystem';

export default defineEventHandler(async (event) => {
  try {
    // Check authorization
    const auth = getHeader(event, 'Authorization');
    if (!auth || !auth.startsWith('Bearer ') || auth.replace('Bearer ', '') !== 'admin-token') {
      return createError({
        statusCode: 403,
        message: 'Forbidden: Admin access required'
      });
    }
    
    const body = await readBody(event);
    await writeSettings(body);
    
    return { success: true };
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Failed to save settings: ${error.message}`
    });
  }
});