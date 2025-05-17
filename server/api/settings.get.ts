import { getSettings } from '~/utils/fileSystem';

export default defineEventHandler(async (event) => {
  try {
    // Allow both admin and readonly users to get settings
    const settings = await getSettings();
    return settings;
  } catch (error) {
    return createError({
      statusCode: 500,
      message: `Failed to get settings: ${error.message}`
    });
  }
});