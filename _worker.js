/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm install` in your terminal to install dependencies
 * - Run `wrangler dev` to start local development
 * - Run `wrangler deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// A library to make it easier to handle routes
import { Router } from 'itty-router';

const router = Router();

// In your wrangler.toml, you should have:
// [[r2_buckets]]
// binding = "ARTIST_BUCKET"
// bucket_name = "your-r2-bucket-name"
//
// [[kv_namespaces]]
// binding = "ARTIST_KV"
// id = "your-kv-namespace-id"


/**
 * A helper function to return a JSON response.
 * @param {object} data - The data to serialize as JSON.
 * @param {number} [status=200] - The HTTP status code.
 * @returns {Response}
 */
const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' },
        status,
    });
};

/**
 * A helper function to parse multipart/form-data.
 * This is a simplified parser. For robust production applications,
 * you might want to use a more comprehensive library if one becomes available.
 * Note: This is a basic implementation and has limitations.
 * @param {Request} request
 * @returns {Promise<Object>}
 */
async function parseMultipartFormData(request) {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
        throw new Error('Invalid content-type. Expected multipart/form-data.');
    }

    const boundary = contentType.split('boundary=')[1];
    const body = await request.text();
    const parts = body.split(`--${boundary}`);

    const result = {
        fields: {},
        files: []
    };

    for (const part of parts) {
        if (part.trim() === '' || part.trim() === '--') continue;

        const [headersPart, contentPart] = part.split('\\r\\n\\r\\n');
        const headers = headersPart.split('\\r\\n');
        
        let contentDisposition = '';
        headers.forEach(h => {
            if(h.toLowerCase().includes('content-disposition')) {
                contentDisposition = h;
            }
        })

        if (!contentDisposition) continue;
        
        const nameMatch = contentDisposition.match(/name="([^"]+)"/);
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        const name = nameMatch ? nameMatch[1] : null;

        if (filenameMatch) {
            // It's a file
            const filename = filenameMatch[1];
            const contentTypeMatch = headersPart.match(/Content-Type: (.+)/i);
            const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
            
            // In a real worker, contentPart is binary. Here we are getting text.
            // A more complex parser would handle ArrayBuffer directly.
            // For simplicity, we are assuming text files or will need to handle binary data appropriately client-side.
            // When the client sends files, it should be as ArrayBuffer, and the worker needs to handle that.
            // This basic parser might not correctly handle binary files from a browser fetch.
            // We will need to get the raw ArrayBuffer and process that.
            // Let's refine this when we implement the full upload logic.
            // For now, this structure gives us the metadata.

            // This is a placeholder for file content handling
            result.files.push({
                name: name,
                filename: filename,
                type: contentType,
                // content: contentPart // This would be binary data in a real scenario
            });

        } else if (name) {
            // It's a form field
            result.fields[name] = contentPart.trim();
        }
    }

    // A better approach for parsing files from a real browser FormData upload
    // is to use `request.formData()` which is becoming standard in modern runtimes.
    // Let's try that first, and fall back to manual parsing if needed.
    const formData = await request.formData();
    const finalResult = { fields: {}, files: [] };
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            finalResult.files.push({
                name: key,
                filename: value.name,
                type: value.type,
                content: await value.arrayBuffer()
            });
        } else {
            finalResult.fields[key] = value;
        }
    }

    return finalResult;
}


// GET /admin/api/artists - List all artists
router.get('/admin/api/artists', async (request, env) => {
    try {
        const { keys } = await env.ARTIST_KV.list();
        const artists = await Promise.all(keys.map(key => env.ARTIST_KV.get(key.name, 'json')));
        return jsonResponse(artists);
    } catch (e) {
        return jsonResponse({ error: e.message }, 500);
    }
});

// POST /admin/api/artists - Create a new artist
router.post('/admin/api/artists', async (request, env) => {
    try {
        // Modern runtimes support request.formData() for multipart data
        const formData = await request.formData();
        const artistName = formData.get('name');
        const artistBio = formData.get('bio');
        const files = formData.getAll('images'); // 'images' is the field name for files

        if (!artistName) {
            return jsonResponse({ error: 'Artist name is required' }, 400);
        }

        const artistId = `artist_${Date.now()}`;
        const imageUrls = [];

        for (const file of files) {
            if (file instanceof File) {
                const imageKey = `${artistId}/${file.name}`;
                await env.ARTIST_BUCKET.put(imageKey, await file.arrayBuffer(), {
                    httpMetadata: { contentType: file.type },
                });
                // The URL to access the image will be like /images/artist_id/filename
                imageUrls.push(`/images/${imageKey}`);
            }
        }

        const artistData = {
            id: artistId,
            name: artistName,
            bio: artistBio,
            images: imageUrls,
        };

        await env.ARTIST_KV.put(artistId, JSON.stringify(artistData));

        return jsonResponse(artistData, 201);

    } catch (e) {
        console.error(e);
        return jsonResponse({ error: `Failed to create artist: ${e.message}` }, 500);
    }
});

// GET /images/:artist_id/:image_name - Serve an image from R2
router.get('/images/:artistId/:imageName', async (request, env) => {
    const { artistId, imageName } = request.params;
    const imageKey = `${artistId}/${imageName}`;

    try {
        const object = await env.ARTIST_BUCKET.get(imageKey);

        if (object === null) {
            return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
            headers,
        });

    } catch (e) {
        return jsonResponse({ error: e.message }, 500);
    }
});

// DELETE /admin/api/artists/:id - Delete an artist
router.delete('/admin/api/artists/:id', async (request, env) => {
    const { id } = request.params;
    try {
        // 1. Get artist data to find images in R2
        const artistData = await env.ARTIST_KV.get(id, 'json');
        if (artistData && artistData.images) {
            // 2. Delete images from R2
            const imageKeys = artistData.images.map(url => url.replace('/images/', ''));
            await env.ARTIST_BUCKET.delete(imageKeys);
        }

        // 3. Delete metadata from KV
        await env.ARTIST_KV.delete(id);
        
        return jsonResponse({ success: true });
    } catch (e) {
        return jsonResponse({ error: e.message }, 500);
    }
});

// Handle 404s
router.all('*', () => new Response('404, not found!', { status: 404 }));

export default {
    async fetch(request, env, ctx) {
      // Pass the request to the router
      return router.handle(request, env, ctx).catch(err => {
        // Catch any errors that bubble up
        return jsonResponse({ error: 'An unexpected error occurred', details: err.message }, 500);
      });
    }
}; 