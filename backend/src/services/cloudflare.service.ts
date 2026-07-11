import fs from 'fs';
import path from 'path';

const CLOUDFLARE_API_TOKEN = process.env.CF_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

export const uploadToCloudflare = async (filePath: string): Promise<string> => {
  if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
    console.warn('Cloudflare credentials missing. Falling back to local URL.');
    return ''; // Return empty string to signal fallback
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    
    const formData = new FormData();
    formData.append('file', blob, path.basename(filePath));

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
        },
        body: formData
      }
    );

    const data = await response.json();

    if (!data.success) {
      console.error('Cloudflare upload failed:', data.errors);
      throw new Error(`Cloudflare upload failed: ${data.errors[0]?.message}`);
    }

    // Return the public variant URL (usually the first one or 'public')
    // data.result.variants is an array of URLs
    return data.result.variants[0];
  } catch (error) {
    console.error('Error uploading to Cloudflare:', error);
    throw error;
  }
};
