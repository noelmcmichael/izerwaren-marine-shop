'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  X, 
  RotateCw,
  Download,
  Share2
} from 'lucide-react';
import { getImageUrl, generateAltText } from '../../lib/image-utils';

interface ProductImage {
  id: string;
  imageUrl?: string;
  localPath?: string;
  altText?: string;
  isPrimary: boolean;
}

interface ImageGalleryProps {
  images: ProductImage[];
  productTitle: string;
  className?: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  productTitle,
  className = '',
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const zoomImageRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Ensure we have at least one image
  const displayImages = images.length > 0 ? images : [
    {
      id: 'placeholder',
      imageUrl: '/images/placeholder-product.jpg',
      altText: `${productTitle} - No image available`,
      isPrimary: true,
    }
  ];

  const currentImage = displayImages[currentImageIndex];

  // Navigation functions
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % displayImages.length);
    resetZoomAndPan();
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    resetZoomAndPan();
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    resetZoomAndPan();
  };

  // Zoom and pan functions
  const resetZoomAndPan = () => {
    setZoomLevel(100);
    setRotation(0);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 25, 300));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 25, 50));
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Pan functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 100) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 100) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch support
  const [lastTouchDistance, setLastTouchDistance] = useState(0);

  const getTouchDistance = (touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };



  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && zoomLevel > 100) {
      setIsPanning(true);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const newZoomLevel = Math.max(50, Math.min(300, zoomLevel * scale));
        setZoomLevel(newZoomLevel);
      }
      
      setLastTouchDistance(distance);
    } else if (e.touches.length === 1 && isPanning && zoomLevel > 100) {
      const deltaX = e.touches[0].clientX - lastPanPoint.x;
      const deltaY = e.touches[0].clientY - lastPanPoint.y;
      
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setLastTouchDistance(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomModalOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextImage();
          break;
        case 'Escape':
          e.preventDefault();
          setIsZoomModalOpen(false);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case 'r':
          e.preventDefault();
          rotate();
          break;
      }
    };

    if (isZoomModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isZoomModalOpen, nextImage, prevImage, zoomIn, zoomOut, rotate]);

  // Auto-scroll thumbnails to current image
  useEffect(() => {
    if (thumbnailsRef.current) {
      const thumbnail = thumbnailsRef.current.children[currentImageIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  }, [currentImageIndex]);

  const downloadImage = () => {
    const imageUrl = getImageUrl(currentImage.imageUrl, currentImage.localPath);
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${productTitle.replace(/\s+/g, '_')}_image_${currentImageIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const shareImage = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          text: `Check out this image of ${productTitle}`,
          url: window.location.href,
        });
      } catch (error) {
        // Sharing failed, fallback to clipboard
      }
    } else {
      // Fallback: copy URL to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main image display */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        <div className="aspect-square relative">
          <Image
            src={getImageUrl(currentImage.imageUrl, currentImage.localPath) || '/images/placeholder-product.jpg'}
            alt={currentImage.altText || generateAltText(productTitle, currentImageIndex)}
            fill
            className="object-contain transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Navigation arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 text-gray-800" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 text-gray-800" />
              </button>
            </>
          )}

          {/* Zoom button */}
          <button
            onClick={() => setIsZoomModalOpen(true)}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Zoom image"
          >
            <ZoomIn className="h-5 w-5 text-gray-800" />
          </button>

          {/* Image counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
              {currentImageIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      {displayImages.length > 1 && (
        <div className="relative">
          <div
            ref={thumbnailsRef}
            className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToImage(index)}
                className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImageIndex
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={getImageUrl(image.imageUrl, image.localPath) || '/images/placeholder-product.jpg'}
                  alt={image.altText || generateAltText(productTitle, index)}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zoom modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Modal header */}
          <div className="absolute top-0 left-0 right-0 bg-black/80 text-white p-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="font-medium">{productTitle}</h3>
                {displayImages.length > 1 && (
                  <span className="text-sm text-gray-300">
                    {currentImageIndex + 1} / {displayImages.length}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button onClick={downloadImage} className="p-2 hover:bg-white/20 rounded">
                  <Download className="h-5 w-5" />
                </button>
                <button onClick={shareImage} className="p-2 hover:bg-white/20 rounded">
                  <Share2 className="h-5 w-5" />
                </button>
                <button onClick={() => setIsZoomModalOpen(false)} className="p-2 hover:bg-white/20 rounded">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Image container */}
          <div
            ref={zoomImageRef}
            className="absolute inset-0 flex items-center justify-center overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: zoomLevel > 100 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
          >
            <div
              className="relative transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center',
              }}
            >
              <Image
                src={getImageUrl(currentImage.imageUrl, currentImage.localPath) || '/images/placeholder-product.jpg'}
                alt={currentImage.altText || generateAltText(productTitle, currentImageIndex)}
                width={800}
                height={800}
                className="max-w-none object-contain"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              />
            </div>
          </div>

          {/* Navigation arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-3"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white rounded-lg p-2">
            <div className="flex items-center space-x-2">
              <button onClick={zoomOut} className="p-2 hover:bg-white/20 rounded">
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-sm min-w-[3rem] text-center">{zoomLevel}%</span>
              <button onClick={zoomIn} className="p-2 hover:bg-white/20 rounded">
                <ZoomIn className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-white/30 mx-2" />
              <button onClick={rotate} className="p-2 hover:bg-white/20 rounded">
                <RotateCw className="h-5 w-5" />
              </button>
              <button onClick={resetZoomAndPan} className="p-2 hover:bg-white/20 rounded text-sm">
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGallery;