/**
 * Recorta una imagen o video a formato 16:9 automáticamente
 * @param {File|Blob} file - Archivo de imagen o video
 * @param {number} targetWidth - Ancho objetivo (opcional, por defecto 1920)
 * @returns {Promise<Blob>} - Blob recortado en formato 16:9
 */
export const cropTo16x9 = async (file, targetWidth = 1920) => {
  const targetHeight = Math.round(targetWidth * (9 / 16));
  const aspectRatio = 16 / 9;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const isVideo = file.type.startsWith('video/');
        
        if (isVideo) {
          // Para videos, extraer un frame y recortarlo
          const videoBlob = await cropVideoTo16x9(file, targetWidth, targetHeight);
          resolve(videoBlob);
        } else {
          // Para imágenes
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('No se pudo obtener el contexto 2d del canvas'));
              return;
            }

            // Calcular dimensiones para recorte centrado manteniendo 16:9
            let sourceWidth = img.width;
            let sourceHeight = img.height;
            let sourceX = 0;
            let sourceY = 0;

            const sourceAspectRatio = sourceWidth / sourceHeight;

            if (sourceAspectRatio > aspectRatio) {
              // La imagen es más ancha que 16:9, recortar los lados
              sourceHeight = sourceHeight;
              sourceWidth = sourceHeight * aspectRatio;
              sourceX = (img.width - sourceWidth) / 2;
            } else {
              // La imagen es más alta que 16:9, recortar arriba/abajo
              sourceWidth = sourceWidth;
              sourceHeight = sourceWidth / aspectRatio;
              sourceY = (img.height - sourceHeight) / 2;
            }

            // Configurar canvas con tamaño objetivo
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            // Dibujar imagen recortada y redimensionada
            ctx.drawImage(
              img,
              sourceX,
              sourceY,
              sourceWidth,
              sourceHeight,
              0,
              0,
              targetWidth,
              targetHeight
            );

            // Convertir a blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Error al crear el blob de la imagen recortada'));
                }
              },
              file.type || 'image/webp',
              0.9
            );
          };
          
          img.onerror = () => reject(new Error('Error al cargar la imagen'));
          img.src = e.target.result;
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Recorta un video extrayendo un frame y recortándolo a 16:9
 * Nota: Para recortar el video completo, se necesitaría una librería más compleja
 * Por ahora, extraemos el primer frame y lo recortamos
 */
const cropVideoTo16x9 = async (videoFile, targetWidth, targetHeight) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('No se pudo obtener el contexto 2d del canvas'));
      return;
    }

    video.onloadedmetadata = () => {
      try {
        // Configurar canvas
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calcular dimensiones para recorte centrado manteniendo 16:9
        const aspectRatio = 16 / 9;
        let sourceWidth = video.videoWidth;
        let sourceHeight = video.videoHeight;
        let sourceX = 0;
        let sourceY = 0;

        const sourceAspectRatio = sourceWidth / sourceHeight;

        if (sourceAspectRatio > aspectRatio) {
          // El video es más ancho que 16:9, recortar los lados
          sourceHeight = sourceHeight;
          sourceWidth = sourceHeight * aspectRatio;
          sourceX = (video.videoWidth - sourceWidth) / 2;
        } else {
          // El video es más alto que 16:9, recortar arriba/abajo
          sourceWidth = sourceWidth;
          sourceHeight = sourceWidth / aspectRatio;
          sourceY = (video.videoHeight - sourceHeight) / 2;
        }

        // Dibujar frame recortado
        ctx.drawImage(
          video,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Convertir a blob (poster del video)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Error al crear el blob del frame del video'));
            }
          },
          'image/webp',
          0.9
        );
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => reject(new Error('Error al cargar el video'));
    video.src = URL.createObjectURL(videoFile);
    video.currentTime = 0.1; // Tomar frame cerca del inicio
  });
};
