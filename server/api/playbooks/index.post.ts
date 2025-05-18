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

    const { filename, content } = await readBody(event);
    if (!filename) {
      throw createError({
        statusCode: 400,
        message: 'Filename is required'
      });
    }
    
    if (!content) {
      throw createError({
        statusCode: 400,
        message: 'Content is required'
      });
    }

    // Create playbooks directory if it doesn't exist
    const playbooksDir = path.resolve('playbooks');
    await fs.mkdir(playbooksDir, { recursive: true });

    const filePath = path.join(playbooksDir, filename);
    
    await fs.writeFile(filePath, content);
    await fs.chmod(filePath, '755');

    // Extract metadata from content
    const metadataMatch = content.match(/^#\s*METADATA:\s*({[\s\S]*?})/m);
    if (!metadataMatch) {
      throw createError({
        statusCode: 400,
        message: 'Invalid content: Missing metadata'
      });
    }
    
    const metadata = JSON.parse(metadataMatch[1]);

    return {
      ...metadata,
      path: filePath,
      content
    };
  } catch (error) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to create playbook'
    });
  }
});