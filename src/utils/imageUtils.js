const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Resize image to maximum dimension of 500px while maintaining aspect ratio
 * @param {string} inputPath - Path to the input image file
 * @param {string} outputPath - Path for the resized image (optional, defaults to input path with suffix)
 * @param {number} maxDimension - Maximum dimension for width or height (default: 500)
 * @returns {Promise<string>} - Path to the resized image
 */
async function resizeImageForAI(inputPath, outputPath = null, maxDimension = 500) {
    try {
        if (!fs.existsSync(inputPath)) {
            throw new Error(`Input image file not found: ${inputPath}`);
        }

        // If no output path provided, create one with suffix
        if (!outputPath) {
            const ext = path.extname(inputPath);
            const base = path.basename(inputPath, ext);
            const dir = path.dirname(inputPath);
            outputPath = path.join(dir, `${base}_resized${ext}`);
        }

        // Get image metadata to check current dimensions
        const metadata = await sharp(inputPath).metadata();
        const { width, height } = metadata;
        
        // Log original dimensions
        console.log(`📏 Original image dimensions: ${width}x${height}`);

        // Check if resizing is needed
        if (width <= maxDimension && height <= maxDimension) {
            console.log(`✅ Image already within ${maxDimension}px limit, no resizing needed`);
            return inputPath; // Return original path if no resize needed
        }

        // Calculate new dimensions maintaining aspect ratio
        let newWidth, newHeight;
        if (width > height) {
            // Landscape: width is the limiting dimension
            newWidth = maxDimension;
            newHeight = Math.round((height * maxDimension) / width);
        } else {
            // Portrait or square: height is the limiting dimension
            newHeight = maxDimension;
            newWidth = Math.round((width * maxDimension) / height);
        }

        console.log(`🔧 Resizing image to: ${newWidth}x${newHeight}`);

        // Resize the image
        await sharp(inputPath)
            .resize(newWidth, newHeight, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 85 }) // Convert to JPEG with good quality to reduce file size
            .toFile(outputPath);

        // Verify the resized image was created
        if (!fs.existsSync(outputPath)) {
            throw new Error('Resized image file was not created');
        }

        // Get file sizes for comparison
        const originalStats = fs.statSync(inputPath);
        const resizedStats = fs.statSync(outputPath);
        const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);
        const resizedSizeMB = (resizedStats.size / (1024 * 1024)).toFixed(2);

        console.log(`📉 Image resized: ${originalSizeMB}MB → ${resizedSizeMB}MB (${((resizedStats.size / originalStats.size) * 100).toFixed(1)}% of original size)`);

        return outputPath;

    } catch (error) {
        console.error('❌ Error resizing image:', error.message);
        // Return original path as fallback if resize fails
        return inputPath;
    }
}

/**
 * Get optimized base64 representation of an image for AI analysis
 * Resizes the image if needed and converts to base64
 * 
 * Token Optimization Strategy:
 * - Resizes images to maxDimension (default 500px) to reduce file size
 * - Combined with 'detail: low' in vision API calls for maximum token savings
 * - 'detail: low' uses only 85 tokens regardless of image size
 * - 'detail: high' would use 170+ tokens based on image dimensions
 * - This combination can reduce token usage by 90%+ while maintaining analysis quality
 * 
 * @param {string} imagePath - Path to the image file
 * @param {number} maxDimension - Maximum dimension for width or height (default: 500)
 * @returns {Promise<{base64: string, mimeType: string, resizedPath: string}>}
 */
async function getOptimizedImageBase64(imagePath, maxDimension = 500) {
    try {
        // First resize the image if needed
        const resizedPath = await resizeImageForAI(imagePath, null, maxDimension);
        
        // Read the (potentially resized) image and convert to base64
        const imageBuffer = fs.readFileSync(resizedPath);
        const base64 = imageBuffer.toString('base64');
        
        // Determine MIME type from the resized image (will be JPEG after resize)
        let mimeType = 'image/jpeg'; // Default to JPEG since we convert during resize
        
        // If we didn't resize (original was small enough), use original format
        if (resizedPath === imagePath) {
            const ext = path.extname(imagePath).toLowerCase();
            switch (ext) {
                case '.png':
                    mimeType = 'image/png';
                    break;
                case '.jpg':
                case '.jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case '.gif':
                    mimeType = 'image/gif';
                    break;
                case '.webp':
                    mimeType = 'image/webp';
                    break;
                default:
                    mimeType = 'image/jpeg';
            }
        }

        console.log(`📦 Image prepared for AI: ${(base64.length / 1024).toFixed(2)}KB base64, ${mimeType}`);

        return {
            base64,
            mimeType,
            resizedPath
        };

    } catch (error) {
        console.error('❌ Error preparing image for AI:', error.message);
        
        // Fallback: try to read original image as-is
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64 = imageBuffer.toString('base64');
            const ext = path.extname(imagePath).toLowerCase();
            let mimeType = 'image/png';
            
            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case '.png':
                    mimeType = 'image/png';
                    break;
                case '.gif':
                    mimeType = 'image/gif';
                    break;
                case '.webp':
                    mimeType = 'image/webp';
                    break;
            }

            console.log(`⚠️  Using original image as fallback: ${(base64.length / 1024).toFixed(2)}KB base64`);
            
            return {
                base64,
                mimeType,
                resizedPath: imagePath
            };
        } catch (fallbackError) {
            console.error('❌ Fallback image reading also failed:', fallbackError.message);
            throw fallbackError;
        }
    }
}

/**
 * Clean up temporary resized image files
 * @param {string} imagePath - Path to the image file to clean up
 */
function cleanupResizedImage(imagePath) {
    try {
        if (imagePath && fs.existsSync(imagePath) && imagePath.includes('_resized')) {
            fs.unlinkSync(imagePath);
            console.log(`🧹 Cleaned up resized image: ${imagePath}`);
        }
    } catch (error) {
        console.warn(`⚠️  Failed to cleanup resized image: ${error.message}`);
    }
}

module.exports = {
    resizeImageForAI,
    getOptimizedImageBase64,
    cleanupResizedImage
};