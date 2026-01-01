export default async function handler(req, res) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;

    // Validate URL parameter
    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    // Security: Only allow HTTP URLs (HTTPS can be accessed directly)
    if (!url.startsWith('http://')) {
        return res.status(400).json({ error: 'Only HTTP URLs can be proxied' });
    }

    // Security: Basic URL validation
    try {
        const parsedUrl = new URL(url);

        // Optional: Whitelist known radio streaming domains
        // const allowedDomains = ['streamtheworld.com', 'shoutcast.com', 'icecast.com'];
        // const hostname = parsedUrl.hostname;
        // if (!allowedDomains.some(domain => hostname.includes(domain))) {
        //   return res.status(403).json({ error: 'Domain not allowed' });
        // }
    } catch (error) {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    try {
        // Fetch the radio stream
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SonicAtlas/1.0',
            },
            // Important: Don't set a timeout, streams are continuous
        });

        if (!response.ok) {
            return res.status(response.status).json({
                error: `Radio server responded with ${response.status}`
            });
        }

        // Set appropriate headers for streaming
        res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');

        // Enable streaming by setting transfer-encoding
        res.setHeader('Transfer-Encoding', 'chunked');

        // Stream the response body directly
        const reader = response.body.getReader();

        const streamToClient = async () => {
            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        res.end();
                        break;
                    }

                    // Write chunk to response
                    if (!res.write(value)) {
                        // If write buffer is full, wait for drain
                        await new Promise(resolve => res.once('drain', resolve));
                    }
                }
            } catch (error) {
                console.error('Streaming error:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Stream interrupted' });
                }
                res.end();
            }
        };

        await streamToClient();

    } catch (error) {
        console.error('Proxy error:', error);

        if (!res.headersSent) {
            return res.status(500).json({
                error: 'Failed to connect to radio stream',
                details: error.message
            });
        }

        res.end();
    }
}
