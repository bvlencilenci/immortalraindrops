
// Usage: node scripts/apply_cors.mjs
// This script applies a permissive CORS policy to the R2 bucket using credentials from .env.local

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// 1. Load .env.local manually (since we don't have dotenv)
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const accountId = env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = env.R2_ACCESS_KEY_ID;
const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
const bucketName = env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error('Missing environment variables. Check .env.local');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const corsRules = [
  {
    AllowedHeaders: ['*'],
    AllowedMethods: ['GET', 'PUT', 'HEAD', 'POST', 'DELETE'],
    AllowedOrigins: ['*'], // For development/production ease. Can be restricted to Vercel domain later.
    ExposeHeaders: ['ETag'],
    MaxAgeSeconds: 3000,
  },
];

console.log(`Applying CORS policy to bucket: ${bucketName}...`);

const command = new PutBucketCorsCommand({
  Bucket: bucketName,
  CORSConfiguration: {
    CORSRules: corsRules,
  },
});

try {
  await s3.send(command);
  console.log('✅ CORS policy applied successfully!');
  console.log('The bucket now allows cross-origin requests from * (including localhost and vercel).');
} catch (err) {
  console.error('❌ Failed to apply CORS policy:', err);
}
