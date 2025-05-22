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
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import fixVideoPath, { videoExists } from '../utils/videoPathFixer';
import fixImagePath from '../utils/imagePathFixer';

const AboutPage = () => {
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
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ 
          backgroundImage: "url('/images/hero-background.jpg')",
          filter: "brightness(0.9)"
        }}></div>
        <div className="absolute inset-0 bg-rich-brown opacity-60 z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-20">
          <div 
            ref={heroSection.elementRef}
            className={`max-w-4xl mx-auto text-center transform transition-all duration-1000 ${heroSection.isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Our Story</h1>
            <div className="w-32 h-1.5 bg-warm-beige mx-auto mb-8"></div>
            <p className="text-xl md:text-2xl mb-8 text-white font-light">Crafting premium nut butters with passion since 2018</p>
            <div className="mt-8">
              <a href="#journey" className="inline-block bg-warm-beige text-rich-brown font-medium px-8 py-3 rounded-full hover:bg-white transition-all duration-300 text-lg">
                Discover Our Journey
              </a>
            </div>
          </div>
        </div>
        
        {/* Decorative nuts illustration */}
        <div className="absolute bottom-0 left-0 w-full">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" className="text-white">
            <path fill="currentColor" fillOpacity="1" d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,48C840,53,960,75,1080,80C1200,85,1320,75,1380,69.3L1440,64L1440,100L1380,100C1320,100,1200,100,1080,100C960,100,840,100,720,100C600,100,480,100,360,100C240,100,120,100,60,100L0,100Z"></path>
          </svg>
        </div>
      </section>

      {/* Our Journey Section */}
      <section id="journey" className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div 
            ref={journeySection.elementRef}
            className={`max-w-6xl mx-auto transition-all duration-1000 ${journeySection.isVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">Our Journey</h2>
              <div className="w-24 h-1 bg-warm-beige mx-auto mb-8"></div>
              <p className="text-lg max-w-3xl mx-auto text-gray-700">From humble beginnings to Kenya's beloved nut butter brand</p>
            </div>
            
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 relative">
                <div className="relative rounded-lg overflow-hidden shadow-xl transform transition-all duration-500 hover:scale-105">
                  <img 
                    src={fixImagePath("/images/creamy-peanut-butter.jpg")} 
                    alt="Linda in her kitchen crafting the first batch of nut butter" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-rich-brown to-transparent opacity-30"></div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-warm-beige py-2 px-4 rounded-lg shadow-lg hidden md:block">
                  <span className="font-bold text-rich-brown flex items-center">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" /> Est. 2018
                  </span>
                </div>
              </div>
              
              <div className="md:col-span-7">
                <div className="bg-soft-green bg-opacity-20 p-6 sm:p-8 rounded-lg">
                  <h3 className="text-2xl font-bold text-rich-brown mb-4">From Kitchen Experiments to Beloved Brand</h3>
                  <p className="mb-4 text-gray-800 leading-relaxed">Linda's Nut Butter began with a simple passion for creating healthier, tastier alternatives to store-bought spreads. What started as weekend experiments in a small Kenyan kitchen has grown into a beloved brand known for quality and flavor.</p>
                  <p className="text-gray-800 leading-relaxed">Founded by Linda Kamau in 2018, our mission has always been to create nut butters using only the finest natural ingredients, supporting local farmers and sustainable practices.</p>
                  
                  <div className="mt-6 flex items-center">
                    <div className="bg-white p-3 rounded-full">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-rich-brown text-xl" />
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-rich-brown">Started in Nairobi, Kenya</h4>
                      <p className="text-sm text-gray-600">Now delivering nationwide with love</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 bg-soft-green bg-opacity-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">Our Values</h2>
            <div className="w-24 h-1 bg-warm-beige mx-auto mb-6"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700">The principles that guide everything we do</p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Natural Ingredients */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="bg-warm-beige p-6 flex justify-center">
                  <FontAwesomeIcon icon={faLeaf} className="text-rich-brown text-4xl" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-rich-brown">Natural Ingredients</h3>
                  <p className="text-gray-600 leading-relaxed">We believe in keeping things simple. Our nut butters contain only the finest natural ingredients with no artificial preservatives, colors, or flavors.</p>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <span className="text-sm font-medium text-warm-beige bg-warm-beige bg-opacity-20 px-3 py-1 rounded-full">100% Natural</span>
                  </div>
                </div>
              </div>
              
              {/* Supporting Local */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="bg-warm-beige p-6 flex justify-center">
                  <FontAwesomeIcon icon={faHandHoldingHeart} className="text-rich-brown text-4xl" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-rich-brown">Supporting Local</h3>
                  <p className="text-gray-600 leading-relaxed">We source our nuts from local Kenyan farmers whenever possible, supporting sustainable farming practices and local communities.</p>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <span className="text-sm font-medium text-warm-beige bg-warm-beige bg-opacity-20 px-3 py-1 rounded-full">Community First</span>
                  </div>
                </div>
              </div>
              
              {/* Quality First */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="bg-warm-beige p-6 flex justify-center">
                  <FontAwesomeIcon icon={faAward} className="text-rich-brown text-4xl" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-rich-brown">Quality First</h3>
                  <p className="text-gray-600 leading-relaxed">Each jar is crafted with care in small batches to ensure consistent quality and flavor that mass-produced alternatives can't match.</p>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <span className="text-sm font-medium text-warm-beige bg-warm-beige bg-opacity-20 px-3 py-1 rounded-full">Premium Quality</span>
                  </div>
                </div>
              </div>
              
              {/* Customer Satisfaction */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="bg-warm-beige p-6 flex justify-center">
                  <FontAwesomeIcon icon={faShoppingBasket} className="text-rich-brown text-4xl" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 text-rich-brown">Customer Satisfaction</h3>
                  <p className="text-gray-600 leading-relaxed">We believe in building relationships with our customers through exceptional products and service that keeps them coming back.</p>
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <span className="text-sm font-medium text-warm-beige bg-warm-beige bg-opacity-20 px-3 py-1 rounded-full">Customer First</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 bg-white p-8 rounded-xl shadow-md">
              <div className="flex flex-col md:flex-row items-center">
                <div className="md:w-1/4 mb-6 md:mb-0">
                  <div className="w-32 h-32 bg-warm-beige rounded-full flex items-center justify-center mx-auto">
                    <FontAwesomeIcon icon={faUsers} className="text-rich-brown text-5xl" />
                  </div>
                </div>
                <div className="md:w-3/4 md:pl-8">
                  <h3 className="text-2xl font-bold text-rich-brown mb-4">Community Impact</h3>
                  <p className="text-gray-700 leading-relaxed">
                    We're not just making nut butter – we're creating meaningful impact in our community. Through our <strong>Nuts for Education</strong> program, we donate a portion of every sale to support local schools and education initiatives across Kenya.
                  </p>
                  <a href="#" className="inline-flex items-center mt-4 text-rich-brown font-medium hover:text-warm-beige transition-colors duration-300">
                    Learn more about our impact <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">What Our Customers Say</h2>
            <div className="w-24 h-1 bg-warm-beige mx-auto mb-6"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700">Real experiences from our nut butter lovers</p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Testimonial 1 */}
              <div className="bg-soft-green bg-opacity-10 p-8 rounded-xl shadow-md transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-4 text-warm-beige">
                  <FontAwesomeIcon icon={faQuoteLeft} className="text-3xl opacity-50" />
                </div>
                <p className="text-gray-700 mb-6 italic">"I've tried many nut butters, but Linda's is truly exceptional. The Chocolate Hazelnut spread is our family's favorite - it's like a healthier, more flavorful version of the commercial brands."</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full overflow-hidden mr-4">
                    <img src={fixImagePath("/images/testimonial-1.jpg")} alt="Sarah M." className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/48'} />
                  </div>
                  <div>
                    <h4 className="font-bold text-rich-brown">Sarah M.</h4>
                    <p className="text-sm text-gray-600">Loyal customer since 2019</p>
                    <div className="flex text-warm-beige mt-1">
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-soft-green bg-opacity-10 p-8 rounded-xl shadow-md transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-4 text-warm-beige">
                  <FontAwesomeIcon icon={faQuoteLeft} className="text-3xl opacity-50" />
                </div>
                <p className="text-gray-700 mb-6 italic">"As a fitness enthusiast, I appreciate that Linda's products are all-natural and protein-rich. The Cashew Butter is now a staple in my post-workout smoothies. Great taste without unnecessary additives!"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full overflow-hidden mr-4">
                    <img src={fixImagePath("/images/testimonial-2.jpg")} alt="David K." className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/48'} />
                  </div>
                  <div>
                    <h4 className="font-bold text-rich-brown">David K.</h4>
                    <p className="text-sm text-gray-600">Fitness coach & food blogger</p>
                    <div className="flex text-warm-beige mt-1">
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-soft-green bg-opacity-10 p-8 rounded-xl shadow-md transform transition-all duration-500 hover:-translate-y-2 hover:shadow-xl">
                <div className="mb-4 text-warm-beige">
                  <FontAwesomeIcon icon={faQuoteLeft} className="text-3xl opacity-50" />
                </div>
                <p className="text-gray-700 mb-6 italic">"I love supporting local businesses, especially those with sustainable practices. Linda's not only delivers on quality but also on their commitment to sourcing from local farmers. The Almond Butter is simply divine!"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-warm-beige rounded-full overflow-hidden mr-4">
                    <img src={fixImagePath("/images/testimonial-3.jpg")} alt="Janet W." className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/48'} />
                  </div>
                  <div>
                    <h4 className="font-bold text-rich-brown">Janet W.</h4>
                    <p className="text-sm text-gray-600">Environmental activist</p>
                    <div className="flex text-warm-beige mt-1">
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                      <FontAwesomeIcon icon={faStar} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-10">
              <a href="#" className="inline-flex items-center bg-rich-brown text-white px-6 py-3 rounded-full hover:bg-warm-beige hover:text-rich-brown transition-all duration-300">
                Read More Reviews <FontAwesomeIcon icon={faChevronRight} className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-16 bg-soft-green bg-opacity-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">Meet Our Team</h2>
            <div className="w-24 h-1 bg-warm-beige mx-auto mb-6"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700">The passionate people behind Linda's Nut Butter who work tirelessly to bring you the finest quality products made with love and care.</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="relative">
              <div className="flex justify-center items-center bg-soft-green bg-opacity-10 overflow-hidden">
                <img 
                  src="/images/lindas-team.jpg" 
                  alt="Linda's Nut Butter team group photo" 
                  className="w-full object-contain max-h-[45rem] py-6 px-4"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-center pointer-events-none">
                <div className="inline-block bg-warm-beige bg-opacity-80 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg pointer-events-auto">
                  <div className="flex items-center justify-center mb-2">
                    <FontAwesomeIcon icon={faUsers} className="text-rich-brown mr-2" />
                    <h3 className="text-xl sm:text-2xl font-bold text-rich-brown">The Craftspeople</h3>
                  </div>
                  <p className="text-sm sm:text-base text-rich-brown">Experts in creating the perfect texture and flavor balance</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <span className="flex items-center bg-warm-beige px-4 py-2 rounded-full">
                  <FontAwesomeIcon icon={faStar} className="text-golden-yellow mr-2" />
                  <span className="font-semibold">Passionate Food Artisans</span>
                </span>
                <span className="flex items-center bg-warm-beige px-4 py-2 rounded-full">
                  <FontAwesomeIcon icon={faStar} className="text-golden-yellow mr-2" />
                  <span className="font-semibold">Quality Control Experts</span>
                </span>
                <span className="flex items-center bg-warm-beige px-4 py-2 rounded-full">
                  <FontAwesomeIcon icon={faStar} className="text-golden-yellow mr-2" />
                  <span className="font-semibold">Local Food Ambassadors</span>
                </span>
              </div>
              
              <p className="text-center text-gray-600">Our diverse team brings together decades of culinary expertise, nutritional knowledge, and a shared passion for creating exceptional nut butters. From carefully selecting the finest raw ingredients to perfecting our artisanal production methods, every team member plays a crucial role in delivering the quality and taste that Linda's Nut Butter is known for throughout Kenya.</p>
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

      {/* Recipe Videos Section */}
      <section className="py-16 bg-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-warm-beige opacity-10 rounded-full"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-soft-green opacity-10 rounded-full"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-rich-brown mb-4">Delicious Recipes</h2>
            <div className="w-24 h-1 bg-warm-beige mx-auto mb-6"></div>
            <p className="text-lg max-w-3xl mx-auto text-gray-700 mb-4">Discover creative ways to enjoy our premium nut butters with these simple, delicious recipes.</p>
            <p className="text-md italic text-gray-500">From quick breakfasts to indulgent desserts, we have recipes for every occasion.</p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Recipe 1 */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl group">
                <div className="relative">
                  {/* Recipe time badge */}
                  <div className="absolute top-4 left-4 z-20 bg-white text-rich-brown px-4 py-2 rounded-full text-sm font-bold shadow-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    5 Min
                  </div>
                  
                  {/* Video overlay */}
                  <div className="relative pt-[56.25%] overflow-hidden">
                    {videoExists('/videos/recipe-video-0.mp4') ? (
                      <>
                        <video 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          controls
                          controlsList="nodownload"
                          poster={fixImagePath('/images/lindas-team.jpg')}
                          preload="metadata"
                          playsInline
                        >
                          <source src={fixVideoPath('/videos/recipe-video-0.mp4')} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        {/* Gradient overlay that disappears when video is playing */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 pointer-events-none"></div>
                        {/* Custom play button that will be hidden when native controls are used */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-warm-beige bg-opacity-90 rounded-full p-4 transform transition-transform duration-500 group-hover:scale-110 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rich-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <img 
                          src={fixImagePath('/images/lindas-team.jpg')} 
                          alt="Almond Butter Banana Smoothie" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-warm-beige bg-opacity-90 rounded-full p-4 transform transition-transform duration-500 group-hover:scale-110 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rich-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-rich-brown shadow-md">
                          Coming Soon
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-warm-beige bg-opacity-20 text-rich-brown px-3 py-1 rounded-full text-sm font-medium">Breakfast</span>
                    <span className="bg-warm-beige bg-opacity-20 text-rich-brown px-3 py-1 rounded-full text-sm font-medium">Quick & Easy</span>
                    <span className="bg-warm-beige bg-opacity-20 text-rich-brown px-3 py-1 rounded-full text-sm font-medium">Healthy</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-rich-brown group-hover:text-warm-beige transition-colors duration-300">Almond Butter Banana Smoothie</h3>
                  
                  <p className="text-gray-700 mb-5 leading-relaxed">Start your day with this energizing smoothie that combines the rich flavor of our creamy almond butter with fresh banana and a touch of honey for natural sweetness.</p>
                  
                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">Main Ingredients:</h4>
                        <div className="flex space-x-2">
                          <span className="inline-block px-2 py-1 bg-soft-green bg-opacity-20 text-xs rounded">Almond Butter</span>
                          <span className="inline-block px-2 py-1 bg-soft-green bg-opacity-20 text-xs rounded">Banana</span>
                          <span className="inline-block px-2 py-1 bg-soft-green bg-opacity-20 text-xs rounded">Honey</span>
                        </div>
                      </div>
                      <a href="#" className="inline-flex items-center text-warm-beige hover:text-rich-brown transition-colors duration-300 font-medium">
                        Full Recipe
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recipe 2 */}
              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl group">
                <div className="relative">
                  {/* Recipe time badge */}
                  <div className="absolute top-4 left-4 z-20 bg-white text-rich-brown px-4 py-2 rounded-full text-sm font-bold shadow-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    10 Min
                  </div>
                  
                  {/* Video overlay */}
                  <div className="relative pt-[56.25%] overflow-hidden">
                    {videoExists('/videos/recipe-video-2.mp4') ? (
                      <>
                        <video 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          controls 
                          controlsList="nodownload"
                          poster={fixImagePath('/images/chocolate-hazelnut-butter.jpg')}
                          preload="metadata"
                          playsInline
                        >
                          <source src={fixVideoPath('/videos/recipe-video-2.mp4')} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                        {/* Gradient overlay that disappears when video is playing */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60 pointer-events-none"></div>
                        {/* Custom play button that will be hidden when native controls are used */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-warm-beige bg-opacity-90 rounded-full p-4 transform transition-transform duration-500 group-hover:scale-110 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rich-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                        <img 
                          src={fixImagePath('/images/chocolate-hazelnut-butter.jpg')} 
                          alt="Chocolate Hazelnut Stuffed Dates" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-warm-beige bg-opacity-90 rounded-full p-4 transform transition-transform duration-500 group-hover:scale-110 shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rich-brown" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-rich-brown shadow-md">
                          Coming Soon
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-warm-beige bg-opacity-20 text-rich-brown px-3 py-1 rounded-full text-sm font-medium">Dessert</span>
                    <span className="bg-warm-beige bg-opacity-20 text-rich-brown px-3 py-1 rounded-full text-sm font-medium">No-Bake</span>
                    <span className="bg-warm-beige bg-opacity-20 text-rich-brown px-3 py-1 rounded-full text-sm font-medium">Snack</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-3 text-rich-brown group-hover:text-warm-beige transition-colors duration-300">Chocolate Hazelnut Stuffed Dates</h3>
                  
                  <p className="text-gray-700 mb-5 leading-relaxed">These decadent treats combine our chocolate hazelnut spread with sweet dates for a guilt-free dessert that satisfies your sweet tooth while providing nutrient-rich energy.</p>
                  
                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-gray-800 mb-1">Main Ingredients:</h4>
                        <div className="flex space-x-2">
                          <span className="inline-block px-2 py-1 bg-soft-green bg-opacity-20 text-xs rounded">Hazelnut Butter</span>
                          <span className="inline-block px-2 py-1 bg-soft-green bg-opacity-20 text-xs rounded">Dates</span>
                          <span className="inline-block px-2 py-1 bg-soft-green bg-opacity-20 text-xs rounded">Chocolate</span>
                        </div>
                      </div>
                      <a href="#" className="inline-flex items-center text-warm-beige hover:text-rich-brown transition-colors duration-300 font-medium">
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
                    <img className="w-10 h-10 rounded-full border-2 border-white" src={fixImagePath("/images/customer-1.jpg")} alt="Customer" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />
                    <img className="w-10 h-10 rounded-full border-2 border-white" src={fixImagePath("/images/customer-2.jpg")} alt="Customer" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />
                    <img className="w-10 h-10 rounded-full border-2 border-white" src={fixImagePath("/images/customer-3.jpg")} alt="Customer" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-warm-beige flex items-center justify-center text-rich-brown font-bold text-xs">+25</div>
                  </div>
                  <p className="ml-4 text-gray-600"><span className="font-bold text-rich-brown">500+</span> happy customers this month</p>
                </div>
              </div>
              <div className="md:w-2/5 relative">
                <div className="h-full">
                  <img 
                    src={fixImagePath("/images/chocolate-hezelnut.jpg")} 
                    alt="Assorted nut butter jars beautifully arranged" 
                    className="w-full h-full object-cover"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/600x800'}
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
