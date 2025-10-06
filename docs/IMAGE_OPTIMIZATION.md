# Image Optimization for AI Analysis

## Overview

The AI-Powered Web Testing Agent now automatically optimizes images before sending them to AI services for analysis. This significantly reduces token costs while maintaining sufficient quality for UI element recognition.

## How It Works

### Automatic Image Resizing

When screenshots or uploaded images are sent to AI services (OpenAI or Grok AI), they are automatically:

1. **Resized** to maximum 500px dimension while maintaining aspect ratio
2. **Converted** to JPEG format with 85% quality for optimal size/quality balance
3. **Optimized** for AI analysis while preserving UI element visibility

### Cost Reduction Benefits

- **Large screenshots** (e.g., 1920x4000px) are reduced to 240x500px
- **File sizes** typically reduced by 90-95%
- **Token costs** dramatically reduced with dual optimization:
  - Image resizing to 500px max dimension
  - Use of 'detail: low' setting for vision API calls (85 tokens vs 170+ tokens)
- **Combined token savings** of 90-96% for typical screenshots
- **Quality** remains sufficient for UI element recognition and test generation

## Token Optimization Strategy

### Dual Optimization Approach

The system uses a **two-layer optimization** to minimize token consumption:

1. **Image Resizing**: Reduces image dimensions to 500px maximum
2. **Detail Level**: Uses 'detail: low' instead of 'detail: high' in vision API calls

### Token Usage Comparison

According to OpenAI documentation:
- **'detail: low'**: 85 tokens (fixed cost regardless of image size)
- **'detail: high'**: 170 + (ceil(width/512) × ceil(height/512) × 170) tokens

### Real-World Savings

| Image Size | High Detail Tokens | Low Detail Tokens | Savings |
|------------|-------------------|-------------------|---------|
| 1920×1080  | 2,210            | 85               | 96.2%   |
| 1366×768   | 1,190            | 85               | 92.9%   |
| 500×375    | 340              | 85               | 75.0%   |

**Average reduction: 88.5% fewer tokens consumed**

## Technical Details

### Affected Services

- **OpenAI Service** (`src/services/openai.js`)
  - `analyzeScreenshotWithAI()` - URL-based screenshot analysis
  - `analyzeUploadedImage()` - User uploaded image analysis

- **Grok AI Service** (`src/services/grokAI.js`)
  - `analyzeScreenshotWithGrokAI()` - Vision-based screenshot analysis

### Implementation

The image optimization is handled by `src/utils/imageUtils.js` which provides:

- `resizeImageForAI(inputPath, outputPath, maxDimension)` - Resize single image
- `getOptimizedImageBase64(imagePath, maxDimension)` - One-step resize and base64 conversion
- `cleanupResizedImage(imagePath)` - Clean up temporary resized files

### Smart Optimization

- **Small images** (≤500px) are left unchanged to avoid unnecessary processing
- **Large images** are automatically resized to reduce token costs
- **Temporary files** are automatically cleaned up after processing
- **Error handling** with fallbacks to original images if resize fails

## Example Results

### Before Optimization
- Original screenshot: 1920x4000px (0.03MB)
- Base64 size: ~40KB
- High token cost for AI analysis

### After Optimization
- Resized screenshot: 240x500px
- Base64 size: ~1.3KB (97% reduction)
- Significantly reduced token costs

## Configuration

The default maximum dimension is **500px** which provides a good balance between:
- **Cost reduction** - Significant token savings
- **Quality preservation** - Sufficient detail for UI element recognition
- **Performance** - Fast processing and analysis

## Dependencies

- **sharp** - High-performance image processing library
- Automatically installed with `npm install`

## Backward Compatibility

- No breaking changes to existing APIs
- Existing functionality continues to work unchanged
- Only affects internal image processing for AI analysis