import { promises as fs } from 'fs';
import path from 'path';

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id');
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Playbook ID is required'
      });
    }

    const playbooksDir = path.resolve('playbooks');
    const files = await fs.readdir(playbooksDir);
    
    // Find the script file that contains the matching ID in its metadata
    for (const filename of files) {
      if (!filename.endsWith('.sh')) continue;
      
      const filePath = path.join(playbooksDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const metadataMatch = content.match(/^#\s*METADATA:\s*({[\s\S]*?})/m);
      if (!metadataMatch) continue;
      
      try {
        const metadata = JSON.parse(metadataMatch[1]);
        if (metadata.id === id) {
          return {
            content,
            metadata
          };
        }
      } catch (error) {
        continue;
      }
    }
    
    throw createError({
      statusCode: 404,
      message: 'Playbook not found'
    });
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to get playbook'
    });
  }
});