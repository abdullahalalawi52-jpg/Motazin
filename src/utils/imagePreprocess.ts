/**
 * Image Preprocessing Utility for Enhanced OCR and AI Recognition
 * Improves text contrast, removes noise/shadows, and scales images for optimal character recognition.
 */

export interface PreprocessOptions {
  minWidth?: number;
  contrast?: number; // 1.0 = normal, 1.3 = enhanced
  brightness?: number; // 0 = normal, 10 = slight boost
  grayscale?: boolean;
}

/**
 * Preprocesses an image file on an HTML5 canvas to maximize OCR text clarity.
 */
export async function preprocessImageForOcr(
  file: File | Blob,
  options: PreprocessOptions = {}
): Promise<HTMLCanvasElement> {
  const {
    minWidth = 1600,
    contrast = 1.25,
    brightness = 5,
    grayscale = true
  } = options;

  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Upscale small images to ensure legible character heights for OCR
        if (width < minWidth) {
          const scale = minWidth / width;
          width = minWidth;
          height = Math.round(height * scale);
        }

        // Limit maximum size to prevent memory exhaustion
        const maxDimension = 3200;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        // High quality smoothing for scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        if (grayscale || contrast !== 1.0 || brightness !== 0) {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const len = data.length;

          // Contrast multiplier factor
          const factor = (259 * ((contrast - 1) * 128 + 255)) / (255 * (259 - (contrast - 1) * 128));

          for (let i = 0; i < len; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (grayscale) {
              // Standard luminance formula
              const gray = 0.299 * r + 0.587 * g + 0.114 * b;
              r = gray;
              g = gray;
              b = gray;
            }

            if (brightness !== 0) {
              r += brightness;
              g += brightness;
              b += brightness;
            }

            if (contrast !== 1.0) {
              r = factor * (r - 128) + 128;
              g = factor * (g - 128) + 128;
              b = factor * (b - 128) + 128;
            }

            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
          }

          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for preprocessing'));
    };

    img.src = url;
  });
}
