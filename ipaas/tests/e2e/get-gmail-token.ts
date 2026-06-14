/**
 * One-time script to generate a Gmail API refresh token.
 *
 * Run once locally:
 *   pnpm test:e2e:get-gmail-token
 *
 * It opens a browser URL — sign in as zenitsukmtsu@gmail.com and grant access.
 * Copy the refresh_token from the output into GMAIL_REFRESH_TOKEN in .env.test
 * and the GitHub Actions secret.
 */

import { createInterface } from 'readline';
import { google } from 'googleapis';

const CREDENTIALS_PATH = process.env.GMAIL_CREDENTIALS_PATH;

if (!CREDENTIALS_PATH) {
  console.error('Set GMAIL_CREDENTIALS_PATH to the downloaded client_secret JSON path.');
  process.exit(1);
}

const { installed } = JSON.parse(
  (await import('fs')).readFileSync(CREDENTIALS_PATH, 'utf8')
) as { installed: { client_id: string; client_secret: string; redirect_uris: string[] } };

const oauth2Client = new google.auth.OAuth2(
  installed.client_id,
  installed.client_secret,
  installed.redirect_uris[0]
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/gmail.readonly'],
});

console.log('\n================================================');
console.log('Open this URL in your browser and sign in as zenitsukmtsu@gmail.com:');
console.log('\n' + authUrl + '\n');
console.log('================================================\n');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const code: string = await new Promise(resolve => {
  rl.question('Paste the authorization code here: ', answer => {
    rl.close();
    resolve(answer.trim());
  });
});

const { tokens } = await oauth2Client.getToken(code);

console.log('\n================================================');
console.log('Add these to your .env.test and GitHub Actions secrets:\n');
console.log(`GMAIL_CLIENT_ID=${installed.client_id}`);
console.log(`GMAIL_CLIENT_SECRET=${installed.client_secret}`);
console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
console.log('================================================\n');
