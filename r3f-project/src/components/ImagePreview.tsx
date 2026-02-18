// src/components/ImagePreview.tsx
import { useState } from 'react';
import Modal from './Modal';
import eyeIcon from '../assets/icon_eye.svg'
import './ImagePreview.css';

interface ImagePreviewProps {
  src: string;
  alt: string;
  modalTitle?: string;
 
  
}

export function ImagePreview({ src, alt, modalTitle }: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Thumbnail with overlay */}
      <div className="image-preview-thumb" onClick={() => setIsOpen(true)}>
        <img src={src} alt={alt} />
        
        <div className="image-preview-overlay">
          <img src={eyeIcon} alt="View larger" />
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={modalTitle ?? alt}
      >
        <img
          src={src}
          alt={alt}
          style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
        />
      </Modal>
    </>
  );
}