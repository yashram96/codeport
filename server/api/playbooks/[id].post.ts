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

    const content = await readBody(event);

    // Validate content
    if (!content) {
      throw createError({
        statusCode: 400,
        message: 'Script content is required'
      });
    }

    // Ensure playbooks directory exists
    const playbooksDir = path.resolve('playbooks');
    await fs.mkdir(playbooksDir, { recursive: true });

    // Find the script file that contains the matching ID
    const files = await fs.readdir(playbooksDir);
    let targetFile = '';
    
    for (const filename of files) {
      if (!filename.endsWith('.sh')) continue;
      
      const filePath = path.join(playbooksDir, filename);
      const currentContent = await fs.readFile(filePath, 'utf-8');
      
      const metadataMatch = currentContent.match(/^#\s*METADATA:\s*({[\s\S]*?})/m);
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

    // Write the updated content
    await fs.writeFile(targetFile, content);
    
    // Make the script executable
    await fs.chmod(targetFile, '755');

    return {
      success: true,
      message: 'Playbook saved successfully'
    };
  } catch (error) {
    console.error('Error saving playbook:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to save playbook'
    });
  }
});