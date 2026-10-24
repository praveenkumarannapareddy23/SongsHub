export function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve({ r: 18, g: 18, b: 18 });
      return;
    }

    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const size = 8;
      canvas.width = size;
      canvas.height = size;

      try {
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        let r = 0, g = 0, b = 0, count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
          if (brightness > 25 && brightness < 230) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count === 0) {
          r = data[0]; g = data[1]; b = data[2];
        } else {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
        }

        resolve({ r, g, b });
      } catch {
        // Tainted canvas (cross-origin without CORS) — return default dark color
        resolve({ r: 18, g: 18, b: 18 });
      }
    };

    img.onerror = () => resolve({ r: 18, g: 18, b: 18 });
  });
}
