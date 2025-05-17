import fs from 'fs-extra';
import path from 'path';
import { getSettings } from '~/utils/fileSystem';

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

    const scriptId = getRouterParam(event, 'id');
    if (!scriptId) {
      return createError({
        statusCode: 400,
        message: 'Script ID is required'
      });
    }

    const settings = await getSettings();
    const script = settings.scripts.find(s => s.id === scriptId);
    
    if (!script) {
      return createError({
        statusCode: 404,
        message: 'Script not found'
      });
    }

    const content = await readBody(event);
    const scriptPath = path.resolve(script.path);
    
    await fs.ensureFile(scriptPath);
    await fs.writeFile(scriptPath, content);
    await fs.chmod(scriptPath, '755');

    return { success: true };
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Failed to save script: ${error.message}`
    });
  }
});