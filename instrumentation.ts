export async function register() {
    // Make Node.js fetch use Clash proxy for external API calls
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    if (proxyUrl) {
        try {
            const { setGlobalDispatcher, ProxyAgent } = await import("undici");
            setGlobalDispatcher(new ProxyAgent(proxyUrl));
            console.log(`[proxy] Using proxy: ${proxyUrl}`);
        } catch (err) {
            console.warn("[proxy] Failed to set up proxy:", err);
        }
    }
}
