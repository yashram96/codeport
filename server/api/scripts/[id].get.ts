import fs from 'fs-extra';
import path from 'path';
import { getSettings } from '~/utils/fileSystem';

export default defineEventHandler(async (event) => {
  try {
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

    const scriptPath = path.resolve(script.path);
    
    // Create default script if it doesn't exist
    if (!await fs.pathExists(scriptPath)) {
      const defaultContent = `#!/bin/bash

# Available environment variables:
# REPOSITORY_ID - The ID of the repository being deployed
# HOST_ID - The ID of the host being deployed to
# TIMESTAMP - Current timestamp

echo "Starting deployment at \${TIMESTAMP}"
echo "Repository: \${REPOSITORY_ID}"
echo "Host: \${HOST_ID}"

# Add your deployment steps here
`;
      await fs.ensureFile(scriptPath);
      await fs.writeFile(scriptPath, defaultContent);
      await fs.chmod(scriptPath, '755');
    }

    const content = await fs.readFile(scriptPath, 'utf-8');
    return content;
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Failed to read script: ${error.message}`
    });
  }
});