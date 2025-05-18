import { getUsers } from '../utils/users';

export default defineEventHandler(async (event) => {
  try {
    const users = await getUsers();
    
    // Remove sensitive data before sending to client
    return users.map(({ id, username, role }) => ({
      id,
      username,
      role
    }));
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to get users: ${error.message}`
    });
  }
});