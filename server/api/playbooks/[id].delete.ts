import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  try {
    // Check authorization
    const auth = getHeader(event, 'Authorization');
    if (!auth?.startsWith('Bearer ') || auth.replace('Bearer ', '') !== 'admin-token') {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized: Admin access required'
      });
    }

    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Playbook ID is required'
      });
    }

    const playbooksDir = path.resolve('playbooks');
    const files = await fs.readdir(playbooksDir);
    
    // Find the script file that contains the matching ID
    let targetFile = '';
    for (const filename of files) {
      if (!filename.endsWith('.sh')) continue;
      
      const filePath = path.join(playbooksDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const metadataMatch = content.match(/^#\s*METADATA:\s*({[\s\S]*?})/m);
      if (!metadataMatch) continue;
      
      try {
        const metadata = JSON.parse(metadataMatch[1]);
        if (metadata.id === id) {
          targetFile = filePath;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!targetFile) {
      throw createError({
        statusCode: 404,
        message: 'Playbook not found'
      });
    }

    // Delete the file
    await fs.unlink(targetFile);

    return {
      success: true,
      message: 'Playbook deleted successfully'
    };
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to delete playbook'
    });
  }
});