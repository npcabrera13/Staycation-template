/**
 * Image utility functions for compressing and converting images to Base64
 * This allows storing images directly in Firestore without needing Firebase Storage
 */

/**
 * Compresses and converts an image file to a Base64 data URL
 * @param file - The image file to process
 * @param maxWidth - Maximum width to resize to (default 800px)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Promise with the Base64 data URL string
 */
export const compressImageToBase64 = (
    file: File,
    maxWidth: number = 800,
    quality: number = 0.7
): Promise<string> => {
    return new Promise((resolve, reject) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            reject(new Error('File must be an image'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                // Create canvas for compression
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to JPEG for better compression
                const base64 = canvas.toDataURL('image/jpeg', quality);

                // Check size (Firestore has 1MB document limit, leave room for other fields)
                const sizeInBytes = (base64.length * 3) / 4; // Approximate base64 size
                const sizeInKB = sizeInBytes / 1024;

                console.log(`Compressed image: ${img.width}x${img.height} -> ${width}x${height}, Size: ${sizeInKB.toFixed(0)}KB`);

                if (sizeInKB > 500) {
                    // If still too large, try with lower quality
                    const lowerQuality = canvas.toDataURL('image/jpeg', 0.4);
                    const lowerSize = (lowerQuality.length * 3) / 4 / 1024;
                    console.log(`Re-compressed with lower quality: ${lowerSize.toFixed(0)}KB`);

                    if (lowerSize > 500) {
                        reject(new Error('Image is too large even after compression. Please use a smaller image (under 2MB recommended).'));
                        return;
                    }
                    resolve(lowerQuality);
                } else {
                    resolve(base64);
                }
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = event.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Validates that a base64 string is a valid image
 */
export const isValidBase64Image = (base64: string): boolean => {
    return base64.startsWith('data:image/');
};
