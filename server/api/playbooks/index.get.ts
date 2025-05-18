import { promises as fs } from 'fs';
import path from 'path';

interface PlaybookMetadata {
  id: string;
  name: string;
  description: string;
  tags: string[];
  section: string;
}

interface PlaybookMetadata {
  id: string;
  name: string;
  description: string;
  tags: string[];
  section: string;
}

export default defineEventHandler(async () => {
  try {
    const playbooksDir = path.resolve('playbooks');
    await fs.mkdir(playbooksDir, { recursive: true });
    
    // Read all .sh files from the playbooks directory
    const files = await fs.readdir(playbooksDir);
    const shellScripts = files.filter(file => file.endsWith('.sh'));
    
    // Parse metadata from each script and handle errors gracefully
    const playbooks = await Promise.all(shellScripts.map(async (filename) => {
      const filePath = path.join(playbooksDir, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Extract metadata from script comments
        const metadataMatch = content.match(/^#\s*METADATA:\s*({[\s\S]*?})/m);
        if (!metadataMatch) {
          console.warn(`No metadata found in ${filename}`);
          return null;
        }
        
        const metadata: PlaybookMetadata = JSON.parse(metadataMatch[1]);
        
        // Validate required fields
        if (!metadata.id || !metadata.name || !metadata.description || !metadata.tags || !metadata.section) {
          console.warn(`Invalid metadata in ${filename}: missing required fields`);
          return null;
        }
        
        return {
          ...metadata,
          path: filePath
        };
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
        return null;
      }
    }));
    
    // Filter out null entries and return valid playbooks
    const validPlaybooks = playbooks.filter(Boolean);
    console.log(`Found ${validPlaybooks.length} valid playbooks`);
    return validPlaybooks;
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: `Failed to get playbooks: ${error.message}`
    });
  }
});