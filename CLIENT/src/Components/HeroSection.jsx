
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "./Navigation";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

// Array of sports images
const fallbackImages = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    title: 'FEEL THE RUSH, LIVE THE ACTION',
    subtitle: 'Dunk your way to victory'
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8c3BvcnRzfGVufDB8fDB8fHww',
    title: 'FEEL THE RUSH, LIVE THE ACTION',
    subtitle: 'Score the winning goal'
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'FEEL THE RUSH, LIVE THE ACTION',
    subtitle: 'Hit it out of the park'
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1600679472829-3044539ce8ed?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'FEEL THE RUSH, LIVE THE ACTION',
    subtitle: 'Ace your competition'
  },
  {
    id: 5,
    url: 'https://images.unsplash.com/photo-1519764622345-23479dd4e542?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    title: 'FEEL THE RUSH, LIVE THE ACTION',
    subtitle: 'Smash your way to the top'
  },
  {
    id: 6,
    url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    title: 'FEEL THE RUSH, LIVE THE ACTION',
    subtitle: 'Sports Like Never Before'
  }
];

const API_BASE_URL = "http://localhost:8000";

const HeroSection = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState(fallbackImages);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

    // Fetch slider images once
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/slider?active=true`);
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const formatted = data.data.map((img, idx) => ({
            id: img._id,
            url: img.url,
            title: img.title,
            subtitle: img.subtitle,
          }));
          setImages(formatted);
        }
      } catch (err) {
        console.error("Failed to load slider images", err);
      }
    };
    fetchImages();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const timer = setTimeout(() => {
      nextSlide();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [currentSlide, isAutoPlaying, nextSlide]);

  return (
    <section className="relative min-h-screen bg-black flex items-center justify-center text-white overflow-hidden">
      <Navigation />
      
      {/* Slides */}
      <div className="absolute inset-0 flex transition-transform duration-1000 ease-in-out" 
     style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
  {images.map((image) => (
    <div key={image.id} className="w-full flex-shrink-0 h-screen relative">
      {/* Background image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${image.url}')` }}
      ></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55" />
    </div>
  ))}
</div>


      {/* Slide Content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in">
            {images[currentSlide]?.title}
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            {images[currentSlide]?.subtitle}
          </p>
          
          <div className="space-y-4">
            <p className="text-lg md:text-xl text-white/80">
              Want To Organize Your Own Events? 
              <span 
                className="text-red-500 ml-2 font-semibold cursor-pointer hover:underline" 
                onClick={() => navigate('/signup/organizer')}
              >
                Click Here →
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/tournaments">
                <Button 
                  size="lg" 
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-4 text-lg cursor-pointer transition-all duration-300"
                >
                  Explore Tournaments
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full z-20 hover:bg-black/70 transition-colors"
        aria-label="Previous slide"
      >
        ←
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-3 rounded-full z-20 hover:bg-black/70 transition-colors"
        aria-label="Next slide"
      >
        →
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-red-500 w-8' : 'bg-white/50'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;
