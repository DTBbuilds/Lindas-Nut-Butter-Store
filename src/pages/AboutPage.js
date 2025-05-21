import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf, faHandHoldingHeart, faAward, faShoppingBasket, faUsers, faStar } from '@fortawesome/free-solid-svg-icons';
import fixVideoPath, { videoExists } from '../utils/videoPathFixer';
import fixImagePath from '../utils/imagePathFixer';

const AboutPage = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="mb-12 relative">
        <div className="bg-soft-green bg-opacity-20 rounded-lg overflow-hidden">
          <div className="container mx-auto py-12 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-rich-brown mb-4">Our Story</h1>
              <div className="w-24 h-1 bg-rich-brown mx-auto mb-6"></div>
              <p className="text-lg mb-6 lora italic">Crafting premium nut butters with passion since 2018</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Journey Section */}
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src="/images/creamy-peanut-butter.jpg" 
                  alt="A jar of creamy peanut butter on a kitchen table" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="md:w-1/2 p-6 sm:p-8 md:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Journey</h2>
                <p className="mb-4">Linda's Nut Butter began with a simple passion for creating healthier, tastier alternatives to store-bought spreads. What started as weekend experiments in a small Kenyan kitchen has grown into a beloved brand known for quality and flavor.</p>
                <p>Founded by Linda Kamau in 2018, our mission has always been to create nut butters using only the finest natural ingredients, supporting local farmers and sustainable practices.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Our Values</h2>
            <div className="w-16 sm:w-24 h-1 bg-rich-brown mx-auto mb-4"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="bg-warm-beige rounded-full p-4 mr-4">
                <FontAwesomeIcon icon={faLeaf} className="text-rich-brown text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Natural Ingredients</h3>
                <p className="text-gray-600">We believe in keeping things simple. Our nut butters contain only the finest natural ingredients with no artificial preservatives, colors, or flavors.</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="bg-warm-beige rounded-full p-4 mr-4">
                <FontAwesomeIcon icon={faHandHoldingHeart} className="text-rich-brown text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Supporting Local</h3>
                <p className="text-gray-600">We source our nuts from local Kenyan farmers whenever possible, supporting sustainable farming practices and local communities.</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="bg-warm-beige rounded-full p-4 mr-4">
                <FontAwesomeIcon icon={faAward} className="text-rich-brown text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Quality First</h3>
                <p className="text-gray-600">Each jar is crafted with care in small batches to ensure consistent quality and flavor that mass-produced alternatives can't match.</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex items-start">
              <div className="bg-warm-beige rounded-full p-4 mr-4">
                <FontAwesomeIcon icon={faShoppingBasket} className="text-rich-brown text-2xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Customer Satisfaction</h3>
                <p className="text-gray-600">We believe in building relationships with our customers through exceptional products and service that keeps them coming back.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Meet Our Team</h2>
            <div className="w-16 sm:w-24 h-1 bg-rich-brown mx-auto mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto">The passionate people behind Linda's Nut Butter who work tirelessly to bring you the finest quality products made with love and care.</p>
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
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Delicious Recipes</h2>
            <div className="w-16 sm:w-24 h-1 bg-rich-brown mx-auto mb-4"></div>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">Discover creative ways to enjoy our premium nut butters with these simple, delicious recipes that the whole family will love.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recipe Video 1 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative pt-[56.25%]">
                {videoExists('/videos/recipe-video-0.mp4') ? (
                  <video 
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                    controls
                    poster={fixImagePath('/images/lindas-team.jpg')}
                    preload="metadata"
                  >
                    <source src={fixVideoPath('/videos/recipe-video-0.mp4')} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg shadow-lg">
                    <img 
                      src={fixImagePath('/images/lindas-team.jpg')} 
                      alt="Video placeholder" 
                      className="w-full h-3/4 object-cover rounded-t-lg" 
                    />
                    <div className="p-4 text-center">
                      <p className="text-gray-600">Video coming soon</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Almond Butter Banana Smoothie</h3>
                <p className="text-gray-600 mb-4">Start your day with this energizing smoothie that combines the rich flavor of our creamy almond butter with fresh banana and a touch of honey for natural sweetness.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-warm-beige text-rich-brown px-3 py-1 rounded-full text-sm">Quick & Easy</span>
                  <span className="bg-warm-beige text-rich-brown px-3 py-1 rounded-full text-sm">Breakfast</span>
                  <span className="bg-warm-beige text-rich-brown px-3 py-1 rounded-full text-sm">5 Minutes</span>
                </div>
              </div>
            </div>
            
            {/* Recipe Video 2 */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative pt-[56.25%]">
                {videoExists('/videos/recipe-video-2.mp4') ? (
                  <video 
                    className="absolute inset-0 w-full h-full object-cover" 
                    controls 
                    poster={fixImagePath('/images/chocolate-hazelnut-butter.jpg')}
                    preload="metadata"
                  >
                    <source src={fixVideoPath('/videos/recipe-video-2.mp4')} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <img 
                      src={fixImagePath('/images/chocolate-hazelnut-butter.jpg')} 
                      alt="Video placeholder" 
                      className="w-full h-3/4 object-cover" 
                    />
                    <div className="p-4 text-center">
                      <p className="text-gray-600">Video coming soon</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">Chocolate Hazelnut Stuffed Dates</h3>
                <p className="text-gray-600 mb-4">These decadent treats combine our chocolate hazelnut spread with sweet dates for a guilt-free dessert that satisfies your sweet tooth while providing nutrient-rich energy.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-warm-beige text-rich-brown px-3 py-1 rounded-full text-sm">No-Bake</span>
                  <span className="bg-warm-beige text-rich-brown px-3 py-1 rounded-full text-sm">Dessert</span>
                  <span className="bg-warm-beige text-rich-brown px-3 py-1 rounded-full text-sm">10 Minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="mb-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-soft-green rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-2/3 p-6 sm:p-8 md:p-10 flex flex-col justify-center">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Taste the Difference?</h2>
                <p className="mb-6">Experience the rich, natural flavors of our premium nut butters made with care and the finest ingredients.</p>
                <Link 
                  to="/products" 
                  className="inline-block bg-rich-brown text-white px-6 py-3 rounded-full hover:bg-soft-green transition-all duration-300 text-center max-w-xs"
                >
                  Shop Our Products
                </Link>
              </div>
              <div className="md:w-1/3 bg-cover bg-center" style={{ backgroundImage: "url('/images/chocolate-hezelnut.jpg')" }}>
                {/* Background image container */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
