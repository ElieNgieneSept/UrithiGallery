import { fetch } from 'undici';

// Configuration from environment variables
const GITHUB_TOKEN = env.GITHUB_TOKEN;
const ADMIN_SECRET = env.ADMIN_SECRET;

// API endpoint for saving data
const API_ENDPOINT = '/api/save-data';

// Handle incoming requests
addEventListener('fetch', event => {
  const request = event.request;
  if (request.url.endsWith(API_ENDPOINT) && request.method === 'POST') {
    // Verify secret in request headers
    const secret = request.headers.get('X-ADMIN-SECRET');
    if (secret === ADMIN_SECRET) {
      // Parse JSON payload
      request.text().then(body => {
        const data = JSON.parse(body);
        // Save to GitHub via API
        fetch('https://api.github.com/repos/ElieNgieneSept/UrithiGallery/contents/data.json', {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
      });
    }
  }
});