/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev` to start local development
 * - Run `wrangler deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// NOTE: We are removing 'itty-router' to avoid build steps on Cloudflare Pages.
// All routing is handled manually in the fetch handler.

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

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const { pathname } = url;
        const method = request.method;

        try {
            // GET /admin/api/artists - List all artists
            if (method === 'GET' && pathname === '/admin/api/artists') {
                const { keys } = await env.ARTIST_KV.list();
                const artists = await Promise.all(keys.map(key => env.ARTIST_KV.get(key.name, 'json')));
                return jsonResponse(artists);
            }

            // POST /admin/api/artists - Create a new artist
            if (method === 'POST' && pathname === '/admin/api/artists') {
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
                    // Make sure it's a file with a name
                    if (file instanceof File && file.name) {
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
            }

            // GET /images/:artistId/:imageName - Serve an image from R2
            const imageMatch = pathname.match(/^\/images\/([^\/]+)\/([^\/]+)$/);
            if (method === 'GET' && imageMatch) {
                const [_, artistId, imageName] = imageMatch;
                const imageKey = `${artistId}/${imageName}`;

                const object = await env.ARTIST_BUCKET.get(imageKey);

                if (object === null) {
                    return new Response('Object Not Found', { status: 404 });
                }

                const headers = new Headers();
                object.writeHttpMetadata(headers);
                headers.set('etag', object.httpEtag);

                return new Response(object.body, { headers });
            }

            // DELETE /admin/api/artists/:id - Delete an artist
            const deleteMatch = pathname.match(/^\/admin\/api\/artists\/([^\/]+)$/);
            if (method === 'DELETE' && deleteMatch) {
                const [_, id] = deleteMatch;
                
                const artistData = await env.ARTIST_KV.get(id, 'json');
                if (artistData && artistData.images && artistData.images.length > 0) {
                    const imageKeys = artistData.images.map(url => url.replace('/images/', ''));
                    await env.ARTIST_BUCKET.delete(imageKeys);
                }

                await env.ARTIST_KV.delete(id);
                
                return jsonResponse({ success: true });
            }

            // If the request does not match any of the API routes, fall through to serving static assets.
            return env.ASSETS.fetch(request);

        } catch (e) {
            console.error(e);
            return jsonResponse({ error: `Worker error: ${e.message}` }, 500);
        }
    }
}; 