/**
 * Resolves media URLs by prepending the backend URL to local paths (starting with /uploads).
 */
export interface MediaOptions {
    quality?: string | number;
    format?: string;
    width?: string | number;
    height?: string | number;
    crop?: string;
}

export const resolveMediaURL = (path: string | undefined | null, options: MediaOptions = {}) => {
    if (!path) return undefined;

    // Fix backslashes
    const normalizedPath = path.replace(/\\/g, '/');

    // If it's already an absolute URL (http/https), Base64, or blob
    let finalUrl = normalizedPath;
    if (!(normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://') || normalizedPath.startsWith('data:') || normalizedPath.startsWith('blob:'))) {
        // Get the base API URL and extract the domain
        const apiURL = process.env.NEXT_PUBLIC_API_URL || '';
        const mediaBase = apiURL.replace(/\/$/, '').replace(/\/api$/, '');

        // Ensure the path starts with /uploads/ if it doesn't already
        let p = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        if (!p.startsWith('/uploads/')) {
            p = `/uploads${p}`;
        }
        finalUrl = `${mediaBase}${p}`.replace(/([^:]\/)\/+/g, "$1");
    }

    // Apply Cloudinary transformations if applicable
    if (finalUrl.includes('cloudinary.com')) {
        try {
            const parts = finalUrl.split('/upload/');
            if (parts.length === 2) {
                const transformationParams = [];
                // Default to q_auto,f_auto if not specified
                transformationParams.push(`q_${options.quality || 'auto'}`);
                transformationParams.push(`f_${options.format || 'auto'}`);

                if (options.width) transformationParams.push(`w_${options.width}`);
                if (options.height) transformationParams.push(`h_${options.height}`);
                if (options.crop) transformationParams.push(`c_${options.crop}`);

                return `${parts[0]}/upload/${transformationParams.join(',')}/${parts[1]}`;
            }
        } catch (err) {
            console.error("Cloudinary transformation failed:", err);
        }
    }

    return finalUrl;
};
