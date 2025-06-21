import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLeaf, 
  faHandHoldingHeart, 
  faAward, 
  faShoppingBasket, 
  faUsers, 
  faStar,
  faQuoteLeft,
  faCalendarAlt,
  faMapMarkerAlt,
  faChevronRight,
  faUtensils,
  faDumbbell,
  faGraduationCap,
  faMugHot,
  faHeartbeat,
  faSmileBeam,
  faVideo,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import fixVideoPath, { videoExists } from '../utils/videoPathFixer';
import fixImagePath from '../utils/imagePathFixer';

// Pre-calculate fixed image paths to avoid re-computation on every render
const imagePaths = {
  patternDots: fixImagePath("/images/pattern-dots.png"),
  chocolateHazelnut: fixImagePath("/images/chocolate-hazelnut-butter.jpg"),
  team: fixImagePath("/images/lindas-team.jpg"),
  customer1: fixImagePath("/images/customer-1.jpg"),
  customer2: fixImagePath("/images/customer-2.jpg"),
  customer3: fixImagePath("/images/customer-3.jpg"),
  chocolateHezelnut: fixImagePath("/images/chocolate-hezelnut.jpg"), // Typo in original path, fixer handles it
};

// Custom styles for animations and mobile video experience
const customStyles = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }

  @keyframes float-delay {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(0px); }
  }

  @keyframes pulse-slow {
    0% { opacity: 0.2; }
    50% { opacity: 0.3; }
    100% { opacity: 0.2; }
  }

  .animate-float {
    animation: float 6s ease-in-out infinite;
  }

  .animate-float-delay {
    animation: float-delay 8s ease-in-out infinite;
  }

  .animate-pulse-slow {
    animation: pulse-slow 8s ease-in-out infinite;
  }

  .hover\\:scale-102:hover {
    transform: scale(1.02);
  }
  
  /* Mobile video enhancements */
  @media (max-width: 768px) {
    .video-play-button {
      width: 72px !important;
      height: 72px !important;
    }
    
    .video-play-icon {
      width: 36px !important;
      height: 36px !important;
    }
    
    .mobile-video-container {
      margin: 0 !important;
      border-width: 2px !important;
    }
    
    .video-controls-bar {
      padding: 8px !important;
    }
    
    .video-control-button {
      width: 40px !important;
      height: 40px !important;
      margin: 0 4px !important;
      min-width: 40px !important;
    }
    
    .video-fullscreen-button {
      display: flex !important;
    }
    
    /* Fix for iOS Safari video playback */
    video::-webkit-media-controls {
      display: none !important;
    }
    
    video {
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Better mobile touch area */
    .play-button {
      -webkit-tap-highlight-color: transparent;
    }
    
    /* Mobile video loading state */
    .loading-indicator {
      z-index: 20;
    }
    
    /* Improved touch response with active state */
    .video-control-button:active {
      background-color: rgba(255, 255, 255, 0.3) !important;
      transform: scale(0.95) !important;
    }
  }
`;

const AboutPage = () => {
  // Add custom styles to document head
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.appendChild(document.createTextNode(customStyles));
    document.head.appendChild(styleElement);
    
    // Cleanup on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Handle video player functionality
  useEffect(() => {
    // Function to handle video play/pause events
    const handleVideoEvents = () => {
      const videos = document.querySelectorAll('video[id^="recipe-video"]');
      
      videos.forEach(video => {
        // Add play event listener
        video.addEventListener('play', () => {
          // Hide the play button overlay when video is playing
          const playButton = video.parentElement.querySelector('.play-button');
          if (playButton) {
            playButton.style.opacity = 0;
            playButton.style.pointerEvents = 'none';
          }
        });
        
        // Add pause event listener
        video.addEventListener('pause', () => {
          // Show the play button overlay when video is paused
          const playButton = video.parentElement.querySelector('.play-button');
          if (playButton) {
            playButton.style.opacity = 1;
            playButton.style.pointerEvents = 'auto';
          }
        });
        
        // Add ended event listener
        video.addEventListener('ended', () => {
          // Show the play button overlay when video ends
          const playButton = video.parentElement.querySelector('.play-button');
          if (playButton) {
            playButton.style.opacity = 1;
            playButton.style.pointerEvents = 'auto';
          }
        });

        // Handle loading state
        video.addEventListener('waiting', () => {
          // Show loading indicator if video is buffering
          const videoContainer = video.parentElement.parentElement;
          const loadingIndicator = videoContainer.querySelector('.loading-indicator');
          if (loadingIndicator) loadingIndicator.style.display = 'flex';
        });

        video.addEventListener('playing', () => {
          // Hide loading indicator when video starts playing
          const videoContainer = video.parentElement.parentElement;
          const loadingIndicator = videoContainer.querySelector('.loading-indicator');
          if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
      });

      // Handle mobile specific behaviors
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      if (isMobile) {
        // Auto-hide controls after a delay on mobile
        const controlsBars = document.querySelectorAll('[id^="video-controls-"]');
        controlsBars.forEach(controls => {
          let hideTimeout;
          
          // When controls are shown, set a timeout to hide them
          const handleControlsVisibility = () => {
            clearTimeout(hideTimeout);
            controls.style.opacity = 1;
            
            hideTimeout = setTimeout(() => {
              // Only hide if video is playing
              const videoId = controls.id.replace('video-controls-', 'recipe-video-');
              const video = document.getElementById(videoId);
              if (video && !video.paused) {
                controls.style.opacity = 0;
              }
            }, 3000); // Hide after 3 seconds of inactivity
          };
          
          controls.addEventListener('touchstart', handleControlsVisibility);
        });

        // Make fullscreen buttons visible on mobile
        const fullscreenButtons = document.querySelectorAll('.video-fullscreen-button');
        fullscreenButtons.forEach(button => {
          button.classList.remove('hidden');
          button.style.display = 'flex';
        });
      }
    };
    
    // Initialize video event handlers after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      handleVideoEvents();
    }, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);
  
  // Scroll animation function
  const useScrollAnimation = () => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (elementRef.current) {
        observer.observe(elementRef.current);
      }

      return () => {
        if (elementRef.current) {
          observer.disconnect();
        }
      };
    }, []);

    return { elementRef, isVisible };
  };

  // Animation refs for different sections
  const heroSection = useScrollAnimation();
  const journeySection = useScrollAnimation();

  return (
    <div className="about-page">
      {/* Hero Section - Enhanced Our Story with vibrant colors */}
      <section className="relative overflow-hidden py-16 md:py-28 min-h-[80vh] flex items-center">
        {/* Parallax effect for background with enhanced brightness */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 transform transition-all duration-700" 
          style={{ 
            backgroundImage: "url('/images/hero-background.jpg')",
            filter: "brightness(0.9) saturate(1.2)", /* Increased brightness and saturation */
            transformOrigin: "center",
            transform: heroSection.isVisible ? 'scale(1.05)' : 'scale(1)',
          }}
        ></div>
        
        {/* Gradient overlay with more vibrant colors */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#6b4423] via-[#8b5a30]/80 to-[#a36b35]/90 opacity-75 z-10"></div>
        
        {/* Decorative elements with enhanced visibility */}
        <div className="absolute top-0 right-0 w-1/3 h-1/3 opacity-25 z-5 animate-pulse">
          <img src={imagePaths.patternDots} alt="" className="w-full h-full object-contain rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 opacity-25 z-5 animate-pulse">
          <img src={imagePaths.patternDots} alt="" className="w-full h-full object-contain -rotate-12" />
        </div>
        
        {/* Additional decorative element - subtle floating circles */}
        <div className="absolute top-1/4 left-10 w-16 h-16 rounded-full bg-[#f8d49a] opacity-20 z-5 animate-float"></div>
        <div className="absolute bottom-1/4 right-10 w-12 h-12 rounded-full bg-[#b8e0d2] opacity-20 z-5 animate-float-delay"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-20">
          <div 
            ref={heroSection.elementRef}
            className={`max-w-5xl mx-auto text-center transform transition-all duration-1000 ${heroSection.isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            {/* Title with accent - enhanced with gradients */}
            <div className="flex justify-center items-center space-x-3 mb-3">
              <div className="h-px w-10 bg-gradient-to-r from-[#f3c06b] to-[#e89d3e] opacity-80"></div>
              <span className="text-[#f8d49a] font-medium tracking-wider uppercase text-sm bg-[#96542c]/30 px-3 py-1 rounded-full shadow-inner">Est. 2018 in Nairobi</span>
              <div className="h-px w-10 bg-gradient-to-l from-[#f3c06b] to-[#e89d3e] opacity-80"></div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight font-lora drop-shadow-lg">Our <span className="text-[#f8d49a]">Story</span></h1>
            <div className="w-32 h-1.5 bg-gradient-to-r from-[#e89d3e] via-[#f3c06b] to-[#e89d3e] mx-auto mb-8 rounded-full shadow-md"></div>
            
            {/* Simplified hero message */}
            <div className="text-white mb-10">
              <div className="bg-[#6b4423]/40 py-6 px-8 rounded-xl shadow-lg inline-block">
                <p className="text-2xl md:text-3xl text-[#f8f0e0] font-light leading-relaxed">
                  From a humble Nairobi kitchen to Kenya's celebrated artisanal nut butter brand
                </p>
              </div>
            </div>
            
            {/* Call to action with enhanced styling and animation */}
            <div className="mt-10 flex flex-col items-center space-y-8">
              <a 
                href="#journey" 
                className="group inline-flex items-center bg-gradient-to-r from-[#f3c06b] to-[#e89d3e] text-rich-brown font-medium px-8 py-4 rounded-full hover:from-[#f8d49a] hover:to-[#f0b155] transition-all duration-300 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <span>Discover Our Journey</span>
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
              
              {/* Animated scroll indicator */}
              <div className="animate-bounce">
                <svg className="w-6 h-6 text-warm-beige" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced decorative wave element */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="text-white">
            <path fill="currentColor" fillOpacity="1" d="M0,32L48,48C96,64,192,96,288,96C384,96,480,64,576,48C672,32,768,32,864,48C960,64,1056,96,1152,96C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Our Journey Section - Enhanced with vibrant colors */}
      <section id="journey" className="py-16 md:py-24 bg-gradient-to-b from-white to-[#f8f0e0]/30 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute left-0 w-24 h-48 bg-[#e89d3e]/10 rounded-r-full transform -translate-y-1/2"></div>
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-[#8b5a30]/10 rounded-full transform translate-x-1/3"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div 
            ref={journeySection.elementRef}
            className={`max-w-6xl mx-auto transition-all duration-1000 ${journeySection.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">Our <span className="text-[#a36b35]">Journey</span></h2>
              <div className="w-24 h-1 bg-gradient-to-r from-[#e89d3e] via-[#f3c06b] to-[#e89d3e] mx-auto mb-8 rounded-full shadow-sm"></div>
              <p className="text-lg max-w-3xl mx-auto text-gray-700 bg-white/50 py-2 px-4 rounded-full inline-block shadow-sm">From humble beginnings to Kenya's beloved nut butter brand</p>
            </div>
            
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="md:col-span-5 relative mb-8 md:mb-0">
                {/* Enhanced image display with better styling */}
                <div className="relative rounded-xl overflow-hidden shadow-2xl transform transition-all duration-500 hover:scale-105 hover:rotate-1 mx-auto max-w-sm sm:max-w-md md:max-w-full border-4 border-[#f3c06b]/20">
                  <div className="aspect-w-4 aspect-h-3 bg-[#f8d49a]/20">
                    <img 
                      src={"/images/Top-about-page.jpg"} 
                      alt="A selection of Linda's Nut Butter products" 
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#6b4423] to-transparent opacity-30"></div>
                </div>
                {/* Est. tag with enhanced styling */}
                <div className="absolute -bottom-4 right-4 md:-right-4 bg-gradient-to-r from-[#f3c06b] to-[#e89d3e] py-2 px-4 rounded-lg shadow-lg transform rotate-2">
                  <span className="font-bold text-rich-brown flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" /> Est. 2018
                  </span>
                </div>
              </div>
              
              <div className="md:col-span-7">
                <div className="space-y-6 text-gray-800 text-lg leading-relaxed">
                  <div className="bg-white p-6 rounded-lg shadow-lg border border-golden-yellow/20">
                    <h3 className="text-2xl font-bold text-rich-brown mb-4">A Message from Our Founder</h3>
                    <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
                      <img src="https://www.gravatar.com/avatar/0?d=mp&s=128" alt="Linda Munyendo, Founder & CEO" className="w-28 h-28 rounded-full mb-4 sm:mb-0 sm:mr-6 border-4 border-golden-yellow object-cover shadow-md"/>
                      <div>
                        <p className="font-bold text-2xl text-gray-900">Linda Munyendo</p>
                        <p className="text-lg text-gray-600">Founder & CEO</p>
                      </div>
                    </div>
                    <p className="italic text-gray-700 text-lg mt-4">
                      "Hello, my name's Linda and I have been making homemade peanut butter, cashew nut butter and almond butter for many years. I also sell nuts and almond milk, as well as various products made with nuts such as granola, muesli and others."
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-lg border border-golden-yellow/20 mt-6">
                    <h3 className="text-2xl font-bold text-rich-brown mb-3">Our Commitment to Quality</h3>
                    <p className="text-lg">
                      My products do not have any chemical and sugar and they are all made from natural ingredients. All ingredients other than almonds are sourced and grown in Kenya. We believe in the power of natural food and are committed to bringing you the best that nature has to offer.
                    </p>
                    <p className="font-semibold text-rich-brown bg-warm-beige/50 p-4 rounded-lg shadow-inner mt-4 text-center text-lg">
                      Please give me a call on <a href="tel:+254725317864" className="text-soft-green hover:underline font-bold">+254 725 317 864</a> if you'd like to chat.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Team Section */}
      <section className="py-16 bg-soft-green bg-opacity-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">Meet Our Team</h2>
            <div className="w-24 h-1 bg-warm-beige mx-auto mb-6"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700">The passionate people behind Linda's Nut Butter who work tirelessly to bring you the finest quality products made with love and care.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Team Photo - Now without obstruction */}
            <div className="flex justify-center items-center bg-soft-green bg-opacity-10 overflow-hidden p-4 sm:p-6">
              <img 
                src={imagePaths.team} 
                alt="Linda's Nut Butter team group photo" 
                className="w-full object-contain max-h-[500px] rounded-lg shadow-md" 
                onError={(e) => e.target.src = 'https://placehold.co/900x500/F5E8C7/5C4033?text=Linda\'s+Team'}
              />
            </div>
            
            {/* Team Description - Now below the image instead of overlapping */}
            <div className="p-6 sm:p-8 border-t border-warm-beige border-opacity-30">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-warm-beige py-3 px-6 rounded-full shadow-md flex items-center">
                  <FontAwesomeIcon icon={faUsers} className="text-rich-brown mr-3 text-xl" />
                  <h3 className="text-xl sm:text-2xl font-bold text-rich-brown">The Craftspeople</h3>
                </div>
              </div>
              
              <p className="text-center text-gray-700 font-medium mb-8">Experts in creating the perfect texture and flavor balance for your favorite nut butters</p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <span className="flex items-center bg-warm-beige px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                  <FontAwesomeIcon icon={faStar} className="text-golden-yellow mr-2" />
                  <span className="font-semibold">Passionate Food Artisans</span>
                </span>
                <span className="flex items-center bg-warm-beige px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                  <FontAwesomeIcon icon={faStar} className="text-golden-yellow mr-2" />
                  <span className="font-semibold">Quality Control Experts</span>
                </span>
                <span className="flex items-center bg-warm-beige px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow duration-300">
                  <FontAwesomeIcon icon={faStar} className="text-golden-yellow mr-2" />
                  <span className="font-semibold">Local Food Ambassadors</span>
                </span>
              </div>
              
              <p className="text-center text-gray-600 max-w-4xl mx-auto">
                Our diverse team brings together decades of culinary expertise, nutritional knowledge, and a shared passion 
                for creating exceptional nut butters. From carefully selecting the finest raw ingredients to perfecting our 
                artisanal production methods, every team member plays a crucial role in delivering the quality and taste 
                that Linda's Nut Butter is known for throughout Kenya.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Process Section */}
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto bg-warm-beige bg-opacity-20 rounded-lg p-6 sm:p-8 md:p-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Our Process</h2>
            
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/4 text-center mb-4 md:mb-0">
                  <div className="bg-rich-brown text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto font-bold text-xl">1</div>
                </div>
                <div className="md:w-3/4">
                  <h3 className="text-xl font-bold mb-2">Sourcing the Finest Nuts</h3>
                  <p>We carefully select premium nuts from trusted suppliers who share our commitment to quality and sustainability.</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/4 text-center mb-4 md:mb-0">
                  <div className="bg-rich-brown text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto font-bold text-xl">2</div>
                </div>
                <div className="md:w-3/4">
                  <h3 className="text-xl font-bold mb-2">Slow Roasting</h3>
                  <p>Our nuts are slow-roasted to perfection to enhance their natural flavors and create the ideal foundation for our butters.</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/4 text-center mb-4 md:mb-0">
                  <div className="bg-rich-brown text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto font-bold text-xl">3</div>
                </div>
                <div className="md:w-3/4">
                  <h3 className="text-xl font-bold mb-2">Small Batch Grinding</h3>
                  <p>We grind our nuts in small batches to achieve the perfect texture and ensure consistent quality in every jar.</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/4 text-center mb-4 md:mb-0">
                  <div className="bg-rich-brown text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto font-bold text-xl">4</div>
                </div>
                <div className="md:w-3/4">
                  <h3 className="text-xl font-bold mb-2">Hand-Crafted with Care</h3>
                  <p>We carefully blend in our signature flavors and ingredients, ensuring each batch meets our exacting standards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - What Our Customers Say */}
      <section className="py-16 bg-warm-beige bg-opacity-10 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-warm-beige opacity-20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-36 h-36 bg-soft-green opacity-20 rounded-full transform translate-x-1/3 translate-y-1/3"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">What Our Customers Say</h2>
            <div className="w-24 h-1 bg-warm-beige mx-auto mb-6"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700">Hear from our satisfied customers who have made Linda's Nut Butter a part of their daily lives</p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Janet's Testimonial */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full mb-4 border-4 border-warm-beige shadow-md flex items-center justify-center bg-soft-green bg-opacity-20">
                      <FontAwesomeIcon 
                        icon={faMugHot} 
                        className="text-rich-brown text-4xl"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-rich-brown mb-1">Janet Kamau</h3>
                    <p className="text-gray-500 mb-4 text-sm">Nairobi, Kenya</p>
                    
                    <div className="flex text-golden-yellow mb-4">
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                    
                    <p className="text-gray-600 text-center italic">"I've been buying Linda's almond butter for over a year now. The texture and flavor are unmatched! My children love it on their morning toast, and I enjoy it in my post-workout smoothies."</p>
                  </div>
                </div>
                <div className="bg-warm-beige bg-opacity-20 px-6 py-3 text-center">
                  <p className="text-sm font-medium text-rich-brown">Loyal customer since 2023</p>
                </div>
              </div>
              
              {/* David's Testimonial */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full mb-4 border-4 border-warm-beige shadow-md flex items-center justify-center bg-soft-green bg-opacity-20">
                      <FontAwesomeIcon 
                        icon={faUtensils} 
                        className="text-rich-brown text-4xl"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-rich-brown mb-1">David Ochieng</h3>
                    <p className="text-gray-500 mb-4 text-sm">Mombasa, Kenya</p>
                    
                    <div className="flex text-golden-yellow mb-4">
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} className="text-gray-300" />
                    </div>
                    
                    <p className="text-gray-600 text-center italic">"The chocolate hazelnut butter is absolutely divine! It's become my go-to treat when I want something sweet but still nutritious. The quality is consistently excellent with every jar."</p>
                  </div>
                </div>
                <div className="bg-warm-beige bg-opacity-20 px-6 py-3 text-center">
                  <p className="text-sm font-medium text-rich-brown">Loyal customer since 2022</p>
                </div>
              </div>
              
              {/* Sarah's Testimonial */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full mb-4 border-4 border-warm-beige shadow-md flex items-center justify-center bg-soft-green bg-opacity-20">
                      <FontAwesomeIcon 
                        icon={faHeartbeat} 
                        className="text-rich-brown text-4xl"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-rich-brown mb-1">Sarah Njeri</h3>
                    <p className="text-gray-500 mb-4 text-sm">Nakuru, Kenya</p>
                    
                    <div className="flex text-golden-yellow mb-4">
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                    
                    <p className="text-gray-600 text-center italic">"As a nutritionist, I'm very careful about what I recommend to my clients. Linda's cashew butter is my top recommendation for those looking for healthy fats in their diet. The taste and purity are exceptional!"</p>
                  </div>
                </div>
                <div className="bg-warm-beige bg-opacity-20 px-6 py-3 text-center">
                  <p className="text-sm font-medium text-rich-brown">Loyal customer since 2021</p>
                </div>
              </div>
            </div>
            
            {/* More testimonials button */}
            <div className="text-center mt-10">
              <a href="#" className="inline-flex items-center bg-warm-beige text-rich-brown px-6 py-3 rounded-full hover:bg-rich-brown hover:text-white transition-all duration-300 font-medium shadow-md group">
                Read More Testimonials
                <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Recipe Videos Section - Enhanced with vibrant colors */}
      <section className="py-16 bg-gradient-to-b from-white to-[#f8f0e0]/30 relative overflow-hidden">
        {/* Enhanced decorative elements with gradients */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-[#f3c06b]/20 to-[#e89d3e]/10 rounded-full animate-pulse-slow"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-gradient-to-tr from-[#a36b35]/15 to-[#8b5a30]/5 rounded-full animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#f8d49a]/10 rounded-full transform -translate-y-1/2 animate-float-delay"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">Delicious <span className="text-[#a36b35]">Recipes</span></h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#e89d3e] via-[#f3c06b] to-[#e89d3e] mx-auto mb-6 rounded-full shadow-sm"></div>
            <p className="text-lg max-w-3xl mx-auto text-[#6b4423] mb-4 bg-white/70 py-2 px-6 rounded-full inline-block shadow-sm">Discover creative ways to enjoy our premium nut butters with these simple, delicious recipes.</p>
            <p className="text-md italic text-[#6b4423]/70 bg-[#f8d49a]/20 py-1 px-4 rounded-full inline-block">From quick breakfasts to indulgent desserts, we have recipes for every occasion.</p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Recipe 1 - Enhanced with gradients and improved video controls */}
              <div className="bg-gradient-to-br from-white to-[#f8f0e0]/30 rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-[#f3c06b]/20">
                <div className="relative">
                  {/* Recipe time badge with enhanced styling */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#f3c06b] to-[#e89d3e] text-[#6b4423] px-4 py-2 rounded-full text-sm font-bold shadow-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    5 Min
                  </div>
                  
                  {/* Mobile-optimized video container with play button overlay */}
                  <div className="relative overflow-hidden border-4 border-[#f3c06b]/30 rounded-lg m-3 mobile-video-container">
                    {videoExists('/videos/recipe-video-0.mp4') ? (
                      <div className="aspect-w-16 aspect-h-9 bg-[#f8f0e0]/70 p-1 rounded-lg group relative">
                        {/* Loading indicator */}
                        <div className="loading-indicator absolute inset-0 z-10 bg-black/30 flex items-center justify-center hidden">
                          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                        </div>
                        {/* Video with custom play button */}
                        <div className="relative w-full h-full">
                          <video 
                            id="recipe-video-0"
                            className="w-full h-full object-cover rounded-md"
                            poster={imagePaths.team}
                            preload="metadata"
                            playsInline
                            onClick={(e) => {
                              const video = e.target;
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }}
                            onTouchStart={() => {
                              // Show controls on mobile touch
                              const controlsBar = document.querySelector('#video-controls-0');
                              if (controlsBar) controlsBar.style.opacity = '1';
                            }}
                          >
                            <source src={fixVideoPath('/videos/recipe-video-0.mp4')} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          
                          {/* Play button overlay that disappears when playing - Mobile optimized */}
                          <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md group-hover:bg-black/30 transition-all duration-300 cursor-pointer play-button"
                            onClick={() => {
                              const video = document.getElementById('recipe-video-0');
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }}
                          >
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 video-play-button">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#a36b35] video-play-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Enhanced mobile-friendly video controls */}
                          <div 
                            id="video-controls-0"
                            className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 to-transparent rounded-b-md video-controls-bar"
                          >
                            <div className="flex items-center justify-between">
                              <button 
                                className="text-white p-1 rounded hover:bg-white/20 video-control-button"
                                onClick={() => {
                                  const video = document.getElementById('recipe-video-0');
                                  video.paused ? video.play() : video.pause();
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              
                              {/* No text on mobile */}
                              <div className="text-white text-xs hidden md:block">Click to play/pause</div>
                              
                              <button 
                                className="text-white p-1 rounded hover:bg-white/20 video-control-button"
                                onClick={() => {
                                  const video = document.getElementById('recipe-video-0');
                                  video.muted = !video.muted;
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                              </button>
                              
                              {/* Fullscreen button for mobile */}
                              <button 
                                className="text-white p-1 rounded hover:bg-white/20 video-control-button hidden video-fullscreen-button"
                                onClick={() => {
                                  const video = document.getElementById('recipe-video-0');
                                  if (video.requestFullscreen) {
                                    video.requestFullscreen();
                                  } else if (video.webkitRequestFullscreen) { /* Safari */
                                    video.webkitRequestFullscreen();
                                  } else if (video.msRequestFullscreen) { /* IE11 */
                                    video.msRequestFullscreen();
                                  }
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-w-16 aspect-h-9 bg-[#f8f0e0]/70 p-1 rounded-lg">
                        <div className="w-full h-full relative rounded-md overflow-hidden">
                          <img 
                            src={imagePaths.team} 
                            alt="Almond Butter Banana Smoothie" 
                            className="w-full h-full object-cover" 
                          />
                          {/* Status badge with enhanced styling */}
                          <div className="absolute bottom-4 right-4 bg-gradient-to-r from-[#6b4423] to-[#8b5a30] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md">
                            Coming Soon
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 bg-white/80">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-[#f8d49a]/30 text-[#6b4423] px-3 py-1 rounded-full text-sm font-medium border border-[#e89d3e]/20">Breakfast</span>
                    <span className="bg-[#f8d49a]/30 text-[#6b4423] px-3 py-1 rounded-full text-sm font-medium border border-[#e89d3e]/20">Quick & Easy</span>
                    <span className="bg-[#f8d49a]/30 text-[#6b4423] px-3 py-1 rounded-full text-sm font-medium border border-[#e89d3e]/20">Healthy</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-[#6b4423] transition-colors duration-300">Almond Butter Banana Smoothie</h3>
                  
                  <p className="text-[#6b4423]/90 mb-5 leading-relaxed">Start your day with this energizing smoothie that combines the rich flavor of our creamy almond butter with fresh banana and a touch of honey for natural sweetness.</p>
                  
                  <div className="border-t border-[#f3c06b]/20 pt-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-[#6b4423] mb-1">Main Ingredients:</h4>
                        <div className="flex space-x-2">
                          <span className="inline-block px-2 py-1 bg-[#b8e0d2]/30 text-xs rounded-md border border-[#b8e0d2]/20">Almond Butter</span>
                          <span className="inline-block px-2 py-1 bg-[#b8e0d2]/30 text-xs rounded-md border border-[#b8e0d2]/20">Banana</span>
                          <span className="inline-block px-2 py-1 bg-[#b8e0d2]/30 text-xs rounded-md border border-[#b8e0d2]/20">Honey</span>
                        </div>
                      </div>
                      <a href="#" className="inline-flex items-center text-[#a36b35] hover:text-[#6b4423] transition-colors duration-300 font-medium bg-[#f8d49a]/20 px-3 py-1 rounded-full">
                        Full Recipe
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recipe 2 - Enhanced with gradients and improved video controls */}
              <div className="bg-gradient-to-br from-white to-[#f8f0e0]/30 rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-[#f3c06b]/20">
                <div className="relative">
                  {/* Recipe time badge with enhanced styling */}
                  <div className="absolute top-4 right-4 z-20 bg-gradient-to-r from-[#f3c06b] to-[#e89d3e] text-[#6b4423] px-4 py-2 rounded-full text-sm font-bold shadow-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    10 Min
                  </div>
                  
                  {/* Mobile-optimized video container with play button overlay */}
                  <div className="relative overflow-hidden border-4 border-[#f3c06b]/30 rounded-lg m-3 mobile-video-container">
                    {videoExists('/videos/recipe-video-2.mp4') ? (
                      <div className="aspect-w-16 aspect-h-9 bg-[#f8f0e0]/70 p-1 rounded-lg group relative">
                        {/* Loading indicator */}
                        <div className="loading-indicator absolute inset-0 z-10 bg-black/30 flex items-center justify-center hidden">
                          <div className="w-12 h-12 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
                        </div>
                        {/* Video with custom play button */}
                        <div className="relative w-full h-full">
                          <video 
                            id="recipe-video-2"
                            className="w-full h-full object-cover rounded-md"
                            poster={"/images/About-page.jpg"}
                            preload="metadata"
                            playsInline
                            onClick={(e) => {
                              const video = e.target;
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }}
                            onTouchStart={() => {
                              // Show controls on mobile touch
                              const controlsBar = document.querySelector('#video-controls-2');
                              if (controlsBar) controlsBar.style.opacity = '1';
                            }}
                          >
                            <source src={fixVideoPath('/videos/recipe-video-2.mp4')} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                          
                          {/* Play button overlay that disappears when playing - Mobile optimized */}
                          <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md group-hover:bg-black/30 transition-all duration-300 cursor-pointer play-button"
                            onClick={() => {
                              const video = document.getElementById('recipe-video-2');
                              if (video.paused) {
                                video.play();
                              } else {
                                video.pause();
                              }
                            }}
                          >
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 video-play-button">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#a36b35] video-play-icon" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Enhanced mobile-friendly video controls */}
                          <div 
                            id="video-controls-2"
                            className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 to-transparent rounded-b-md video-controls-bar"
                          >
                            <div className="flex items-center justify-between">
                              <button 
                                className="text-white p-1 rounded hover:bg-white/20 video-control-button"
                                onClick={() => {
                                  const video = document.getElementById('recipe-video-2');
                                  video.paused ? video.play() : video.pause();
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              
                              {/* No text on mobile */}
                              <div className="text-white text-xs hidden md:block">Click to play/pause</div>
                              
                              <button 
                                className="text-white p-1 rounded hover:bg-white/20 video-control-button"
                                onClick={() => {
                                  const video = document.getElementById('recipe-video-2');
                                  video.muted = !video.muted;
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                              </button>
                              
                              {/* Fullscreen button for mobile */}
                              <button 
                                className="text-white p-1 rounded hover:bg-white/20 video-control-button hidden video-fullscreen-button"
                                onClick={() => {
                                  const video = document.getElementById('recipe-video-2');
                                  if (video.requestFullscreen) {
                                    video.requestFullscreen();
                                  } else if (video.webkitRequestFullscreen) { /* Safari */
                                    video.webkitRequestFullscreen();
                                  } else if (video.msRequestFullscreen) { /* IE11 */
                                    video.msRequestFullscreen();
                                  }
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-w-16 aspect-h-9 bg-[#f8f0e0]/70 p-1 rounded-lg">
                        <div className="w-full h-full relative rounded-md overflow-hidden">
                          <img 
                            src={"/images/About-page.jpg"} 
                            alt="Linda's Nut Butter Products" 
                            className="w-full h-full object-cover" 
                          />
                          {/* Status badge with enhanced styling */}
                          <div className="absolute bottom-4 right-4 bg-gradient-to-r from-[#6b4423] to-[#8b5a30] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md">
                            Coming Soon
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 bg-white/80">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-[#f8d49a]/30 text-[#6b4423] px-3 py-1 rounded-full text-sm font-medium border border-[#e89d3e]/20">Dessert</span>
                    <span className="bg-[#f8d49a]/30 text-[#6b4423] px-3 py-1 rounded-full text-sm font-medium border border-[#e89d3e]/20">No-Bake</span>
                    <span className="bg-[#f8d49a]/30 text-[#6b4423] px-3 py-1 rounded-full text-sm font-medium border border-[#e89d3e]/20">Snack</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-[#6b4423] transition-colors duration-300">Chocolate Hazelnut Stuffed Dates</h3>
                  
                  <p className="text-[#6b4423]/90 mb-5 leading-relaxed">These decadent treats combine our chocolate hazelnut spread with sweet dates for a guilt-free dessert that satisfies your sweet tooth while providing nutrient-rich energy.</p>
                  
                  <div className="border-t border-[#f3c06b]/20 pt-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-[#6b4423] mb-1">Main Ingredients:</h4>
                        <div className="flex space-x-2">
                          <span className="inline-block px-2 py-1 bg-[#b8e0d2]/30 text-xs rounded-md border border-[#b8e0d2]/20">Hazelnut Butter</span>
                          <span className="inline-block px-2 py-1 bg-[#b8e0d2]/30 text-xs rounded-md border border-[#b8e0d2]/20">Dates</span>
                          <span className="inline-block px-2 py-1 bg-[#b8e0d2]/30 text-xs rounded-md border border-[#b8e0d2]/20">Chocolate</span>
                        </div>
                      </div>
                      <a href="#" className="inline-flex items-center text-[#a36b35] hover:text-[#6b4423] transition-colors duration-300 font-medium bg-[#f8d49a]/20 px-3 py-1 rounded-full">
                        Full Recipe
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Browse more recipes button */}
            <div className="text-center mt-12">
              <a href="#" className="inline-flex items-center bg-rich-brown text-white px-8 py-4 rounded-full hover:bg-warm-beige hover:text-rich-brown transition-all duration-300 text-lg font-medium shadow-lg group">
                Browse All Recipes
                <span className="ml-2 transform transition-transform duration-300 group-hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/images/nut-pattern-bg.jpg')" }}></div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto bg-gradient-to-r from-warm-beige to-soft-green rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-700 hover:scale-[1.02]">
            <div className="md:flex">
              <div className="md:w-3/5 p-8 sm:p-10 md:p-12 flex flex-col justify-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-6 leading-tight">Ready to Taste the Difference?</h2>
                <p className="text-lg mb-8 text-gray-700 leading-relaxed">Experience the rich, natural flavors of our premium nut butters made with care and the finest ingredients. Your taste buds will thank you!</p>
                <div className="flex flex-wrap gap-4">
                  <Link 
                    to="/products" 
                    className="inline-flex items-center bg-rich-brown text-white px-8 py-4 rounded-full hover:bg-warm-beige hover:text-rich-brown transition-all duration-300 text-lg font-medium shadow-lg"
                  >
                    Shop Our Products <FontAwesomeIcon icon={faShoppingBasket} className="ml-2" />
                  </Link>
                  <a 
                    href="#journey" 
                    className="inline-flex items-center bg-white text-rich-brown border-2 border-rich-brown px-8 py-4 rounded-full hover:bg-rich-brown hover:text-white transition-all duration-300 text-lg font-medium"
                  >
                    Our Story
                  </a>
                </div>
                <div className="mt-8 flex items-center">
                  <div className="flex -space-x-2">
                    <img className="w-10 h-10 rounded-full border-2 border-white" src={imagePaths.customer1} alt="Customer" onError={(e) => e.target.src = 'https://placehold.co/40'} />
                    <img className="w-10 h-10 rounded-full border-2 border-white" src={imagePaths.customer2} alt="Customer" onError={(e) => e.target.src = 'https://placehold.co/40'} />
                    <img className="w-10 h-10 rounded-full border-2 border-white" src={imagePaths.customer3} alt="Customer" onError={(e) => e.target.src = 'https://placehold.co/40'} />
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-warm-beige flex items-center justify-center text-rich-brown font-bold text-xs">+25</div>
                  </div>
                  <div className="ml-4 flex items-center bg-[#f8d49a]/20 py-2 px-4 rounded-lg">
                    <FontAwesomeIcon icon={faSmileBeam} className="text-[#a36b35] text-xl mr-2" />
                    <p className="text-gray-600"><span className="font-bold text-rich-brown">500+</span> happy customers this month</p>
                  </div>
                </div>
              </div>
              <div className="md:w-2/5 relative">
                <div className="h-full">
                  <img 
                    src={"/images/About-page.jpg"} 
                    alt="Assorted nut butter jars beautifully arranged" 
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = 'https://placehold.co/600x800'}
                  />
                  <div className="absolute top-0 right-0 bg-warm-beige text-rich-brown py-2 px-4 rounded-bl-lg font-bold">
                    <span className="block text-lg">NEW</span>
                    <span className="block text-sm">Flavors</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
