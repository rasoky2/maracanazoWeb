import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Slider } from '@heroui/react';
import { FaCrop, FaCheck, FaTimes } from 'react-icons/fa';
import { getCroppedImg } from '../utils/cropImage.js';

const ImageCropper = ({ isOpen, onClose, imageFile, onCropComplete, aspectRatio = null }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = e => {
        setImageSrc(e.target.result);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImageSrc(null);
    }
  }, [imageFile]);

  const onCropChange = useCallback(crop => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback(zoom => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      return;
    }

    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      handleClose();
    } catch (error) {
      console.info('Error al recortar imagen:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <FaCrop />
            Recortar Imagen
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center">
            {imageSrc && (
              <>
                <div className="relative w-full" style={{ height: '400px', background: '#333' }}>
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspectRatio || undefined}
                    onCropChange={onCropChange}
                    onZoomChange={onZoomChange}
                    onCropComplete={onCropCompleteCallback}
                    style={{
                      containerStyle: {
                        width: '100%',
                        height: '100%',
                        position: 'relative'
                      }
                    }}
                  />
                </div>
                <div className="mt-4 w-full px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 min-w-[20px]">−</span>
                    <Slider
                      aria-label="Zoom"
                      value={zoom}
                      onChange={onZoomChange}
                      minValue={1}
                      maxValue={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 min-w-[20px]">+</span>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-600 text-center">
                  <p>Arrastra la imagen para ajustar el recorte</p>
                  <p className="text-xs mt-1">Usa el zoom para acercar o alejar</p>
                </div>
              </>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} isDisabled={loading}>
            <FaTimes className="mr-2" />
            Cancelar
          </Button>
          <Button color="primary" onPress={handleCrop} isLoading={loading}>
            <FaCheck className="mr-2" />
            Recortar y Guardar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

ImageCropper.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageFile: PropTypes.instanceOf(File),
  onCropComplete: PropTypes.func.isRequired,
  aspectRatio: PropTypes.number
};

export default ImageCropper;
