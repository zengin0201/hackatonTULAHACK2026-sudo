import { useState } from 'react';
import { PawPrint } from 'lucide-react';

interface ImageCarouselProps {
  imageUrls: string[];
  petName: string;
}

export const ImageCarousel = ({ imageUrls, petName }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!imageUrls || imageUrls.length === 0) {
    return <PawPrint className="w-full h-full p-4 text-app-dim opacity-50" />;
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < imageUrls.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  return (
    <div className="relative w-full h-full">
      <img
        src={imageUrls[currentIndex]}
        alt={petName}
        className="w-full h-full object-cover pointer-events-none select-none"
      />

      {imageUrls.length > 1 && (
        <>
          <div
            className="absolute top-0 left-0 w-1/2 h-full z-10 cursor-pointer"
            onClick={prevImage}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-full z-10 cursor-pointer"
            onClick={nextImage}
          />

          <div className="absolute top-3 left-0 w-full flex gap-1 px-3 z-20">
            {imageUrls.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)]'
                    : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};