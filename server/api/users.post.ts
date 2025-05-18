import { updateUsers } from '../utils/users';

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
    
    const users = await readBody(event);
    await updateUsers(users);
    
    return { success: true };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to update users: ${error.message}`
    });
  }
});