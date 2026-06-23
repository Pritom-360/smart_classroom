/**
 * Client-side image compressor using HTML5 Canvas
 * Resizes and compresses image files to reduce storage size.
 *
 * @param {File} file - The original uploaded file
 * @param {Object} options - Compression parameters
 * @param {number} options.maxWidth - Maximum width of the image
 * @param {number} options.maxHeight - Maximum height of the image
 * @param {number} options.quality - JPEG compression quality (0.0 to 1.0)
 * @returns {Promise<File>} Compressed File object, or original if not an image
 */
export async function compressImage(file, { maxWidth = 1000, maxHeight = 1000, quality = 0.75 } = {}) {
  // If the file is not an image, return it as-is
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Do not compress SVG files
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // If image has transparency (PNG) and we export as JPEG, we should fill with white
        const isPng = file.type === 'image/png';
        if (!isPng) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const exportType = isPng ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new File from the blob
              const compressedFile = new File([blob], file.name, {
                type: exportType,
                lastModified: Date.now(),
              });
              
              // Only return compressed if it is actually smaller than original
              if (compressedFile.size < file.size) {
                console.log(
                  `[ImageCompressor] Compressed "${file.name}" from ${(file.size / 1024).toFixed(1)}KB to ${(compressedFile.size / 1024).toFixed(1)}KB`
                );
                resolve(compressedFile);
              } else {
                console.log(`[ImageCompressor] Original file was smaller/equal, using original`);
                resolve(file);
              }
            } else {
              resolve(file);
            }
          },
          exportType,
          isPng ? undefined : quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
