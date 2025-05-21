import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles/rangeSlider.css';
import { 
  faFilter, 
  faSort, 
  faCheck, 
  faTimes, 
  faChevronDown, 
  faChevronUp,
  faFire,
  faLeaf,
  faSeedling,
  faWheatAlt,
  faUtensils,
  faSliders
} from '@fortawesome/free-solid-svg-icons';

function FilterSidebar({ filters, setFilters, categories }) {
  // Local state for collapsible sections
  const [sectionsOpen, setSectionsOpen] = useState({
    categories: true,
    price: true,
    features: true,
    sort: true
  });

  // Store selected price range in local state for more responsive UI
  const [localPriceRange, setLocalPriceRange] = useState({
    min: filters.priceRange.min,
    max: filters.priceRange.max
  });

  // Enhanced category icons mapping
  const categoryIcons = {
    'Almonds': faSeedling,
    'Cashew': faSeedling,
    'Macadamia': faSeedling,
    'Peanut': faSeedling,
    'Hazelnut': faSeedling,
    'Seed Butters': faSeedling,
    'Honey': faLeaf
  };
  
  // Enhanced features with icons and more options
  const featuresWithIcons = [
    { id: 'organic', label: 'Organic', icon: faLeaf },
    { id: 'vegan', label: 'Vegan', icon: faUtensils },
    { id: 'gluten-free', label: 'Gluten-Free', icon: faWheatAlt },
    { id: 'no-sugar', label: 'No Added Sugar', icon: faFire },
    { id: 'high-protein', label: 'High Protein', icon: faFire },
    { id: 'keto-friendly', label: 'Keto-Friendly', icon: faLeaf }
  ];
  
  // Apply price range debounced to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters({
        ...filters,
        priceRange: localPriceRange
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [localPriceRange]);
  
  // Toggle section visibility
  const toggleSection = (section) => {
    setSectionsOpen({
      ...sectionsOpen,
      [section]: !sectionsOpen[section]
    });
  };

  // Handle category selection with improved UI feedback
  const handleCategoryChange = (category) => {
    if (filters.categories.includes(category)) {
      setFilters({
        ...filters,
        categories: filters.categories.filter(c => c !== category)
      });
    } else {
      setFilters({
        ...filters,
        categories: [...filters.categories, category]
      });
    }
  };

  // Enhanced sort handler
  const handleSortChange = (sortOption) => {
    setFilters({
      ...filters,
      sort: sortOption
    });
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilters({
      categories: [],
      priceRange: { min: 0, max: 3000 },
      features: [],
      sort: 'price-low'
    });
    setLocalPriceRange({ min: 0, max: 3000 });
  };

  // Count active filters
  const activeFilterCount = (
    filters.categories.length + 
    filters.features.length + 
    (filters.priceRange.max < 3000 || filters.priceRange.min > 0 ? 1 : 0)
  );

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
      {/* Header with active filter count */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold flex items-center text-rich-brown">
          <FontAwesomeIcon icon={faFilter} className="mr-2 text-soft-green" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 bg-soft-green text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <button 
            onClick={resetAllFilters}
            className="text-gray-500 hover:text-soft-green text-sm font-medium flex items-center transition-colors"
            aria-label="Reset all filters"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-1" />
            Clear All
          </button>
        )}
      </div>
      
      {/* Categories Section */}
      <div className="mb-6 border-b border-gray-100 pb-5">
        <button 
          className="w-full flex justify-between items-center font-bold mb-3 hover:text-soft-green transition-colors"
          onClick={() => toggleSection('categories')}
          aria-expanded={sectionsOpen.categories.toString()}
          aria-controls="categories-content"
        >
          <span className="flex items-center">
            <FontAwesomeIcon icon={faSeedling} className="mr-2 text-soft-green" />
            Categories
          </span>
          <FontAwesomeIcon 
            icon={sectionsOpen.categories ? faChevronUp : faChevronDown} 
            className="text-sm text-gray-400" 
          />
        </button>
        
        {sectionsOpen.categories && (
          <div id="categories-content" className="space-y-2">
            {categories.map(category => (
              <div 
                key={category} 
                className={`flex items-center px-2 py-1.5 rounded-md transition-colors ${filters.categories.includes(category) ? 'bg-soft-green bg-opacity-10' : 'hover:bg-gray-50'}`}
              >
                <button
                  id={`category-${category.toLowerCase().replace(' ', '-')}`}
                  className={`w-5 h-5 rounded-md mr-3 flex items-center justify-center transition-colors ${
                    filters.categories.includes(category) 
                      ? 'bg-soft-green text-white border-transparent' 
                      : 'border border-gray-300 hover:border-soft-green'
                  }`}
                  onClick={() => handleCategoryChange(category)}
                  aria-pressed={filters.categories.includes(category).toString()}
                  aria-label={`Filter by ${category}`}
                >
                  {filters.categories.includes(category) && (
                    <FontAwesomeIcon icon={faCheck} className="text-xs" aria-hidden="true" />
                  )}
                </button>
                <label 
                  htmlFor={`category-${category.toLowerCase().replace(' ', '-')}`}
                  className="flex-1 cursor-pointer flex items-center"
                  onClick={() => handleCategoryChange(category)}
                >
                  <FontAwesomeIcon 
                    icon={categoryIcons[category] || faSeedling} 
                    className="mr-2 text-gray-500" 
                    aria-hidden="true" 
                  />
                  <span className="capitalize">{category}</span>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Price Range Section */}
      <div className="mb-6 border-b border-gray-100 pb-5">
        <button 
          className="w-full flex justify-between items-center font-bold mb-3 hover:text-soft-green transition-colors"
          onClick={() => toggleSection('price')}
          aria-expanded={sectionsOpen.price.toString()}
          aria-controls="price-content"
        >
          <span className="flex items-center">
            <FontAwesomeIcon icon={faSliders} className="mr-2 text-soft-green" />
            Price Range
          </span>
          <FontAwesomeIcon 
            icon={sectionsOpen.price ? faChevronUp : faChevronDown} 
            className="text-sm text-gray-400" 
          />
        </button>
        
        {sectionsOpen.price && (
          <div id="price-content" className="px-2">
            {/* Interactive low-high range input with visual feedback */}
            <div className="relative pt-6 pb-8">
              <div className="absolute left-0 right-0 h-2 bg-gray-200 rounded-lg top-8"></div>
              <div 
                className="absolute h-2 bg-soft-green rounded-lg top-8" 
                style={{
                  left: `${(localPriceRange.min / 3000) * 100}%`,
                  right: `${100 - ((localPriceRange.max / 3000) * 100)}%`
                }}
              ></div>
              
              <input 
                type="range" 
                min="0" 
                max="3000" 
                step="50"
                value={localPriceRange.min}
                onChange={(e) => setLocalPriceRange({
                  ...localPriceRange,
                  min: parseInt(e.target.value) > localPriceRange.max ? localPriceRange.max : parseInt(e.target.value)
                })}
                className="absolute top-7 w-full h-4 appearance-none bg-transparent pointer-events-none z-10"
                aria-valuemin="0"
                aria-valuemax="3000"
                aria-valuenow={localPriceRange.min}
                aria-label="Minimum price range"
              />
              
              <input 
                type="range" 
                min="0" 
                max="3000" 
                step="50"
                value={localPriceRange.max}
                onChange={(e) => setLocalPriceRange({
                  ...localPriceRange,
                  max: parseInt(e.target.value) < localPriceRange.min ? localPriceRange.min : parseInt(e.target.value)
                })}
                className="absolute top-7 w-full h-4 appearance-none bg-transparent pointer-events-none z-20"
                aria-valuemin="0"
                aria-valuemax="3000"
                aria-valuenow={localPriceRange.max}
                aria-label="Maximum price range"
              />
              
              {/* Slider thumb styling - using regular style attribute instead of styled-jsx */}
              
              {/* Price input fields */}
              <div className="flex justify-between mt-6">
                <div className="w-[45%]">
                  <label className="text-xs text-gray-500 block mb-1">Min Price</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">KES</span>
                    <input 
                      type="number" 
                      min="0" 
                      max={localPriceRange.max}
                      value={localPriceRange.min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= localPriceRange.max) {
                          setLocalPriceRange({ ...localPriceRange, min: val });
                        }
                      }}
                      className="w-full pl-10 pr-2 py-1 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="w-[45%]">
                  <label className="text-xs text-gray-500 block mb-1">Max Price</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">KES</span>
                    <input 
                      type="number" 
                      min={localPriceRange.min}
                      max="3000"
                      value={localPriceRange.max}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= localPriceRange.min && val <= 3000) {
                          setLocalPriceRange({ ...localPriceRange, max: val });
                        }
                      }}
                      className="w-full pl-10 pr-2 py-1 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* Common price points quick select */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[500, 1000, 1500, 2000, 2500].map(price => (
                  <button
                    key={price}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${price <= localPriceRange.max && price >= localPriceRange.min ? 'bg-soft-green bg-opacity-10 border-soft-green text-soft-green' : 'border-gray-200 hover:border-soft-green'}`}
                    onClick={() => setLocalPriceRange({ min: 0, max: price })}
                  >
                    Under KES {price}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Features Section */}
      <div className="mb-6 border-b border-gray-100 pb-5">
        <button 
          className="w-full flex justify-between items-center font-bold mb-3 hover:text-soft-green transition-colors"
          onClick={() => toggleSection('features')}
          aria-expanded={sectionsOpen.features.toString()}
          aria-controls="features-content"
        >
          <span className="flex items-center">
            <FontAwesomeIcon icon={faLeaf} className="mr-2 text-soft-green" />
            Features
          </span>
          <FontAwesomeIcon 
            icon={sectionsOpen.features ? faChevronUp : faChevronDown} 
            className="text-sm text-gray-400" 
          />
        </button>
        
        {sectionsOpen.features && (
          <div id="features-content" className="grid grid-cols-2 gap-2 px-1">
            {featuresWithIcons.map(feature => {
              const isSelected = filters.features.includes(feature.label);
              return (
                <button
                  key={feature.id}
                  aria-pressed={isSelected.toString()}
                  className={`flex items-center px-2 py-2 rounded-md transition-all ${isSelected ? 'bg-soft-green text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100'}`}
                  onClick={() => {
                    if (isSelected) {
                      setFilters({
                        ...filters,
                        features: filters.features.filter(f => f !== feature.label)
                      });
                    } else {
                      setFilters({
                        ...filters,
                        features: [...filters.features, feature.label]
                      });
                    }
                  }}
                >
                  <FontAwesomeIcon 
                    icon={feature.icon} 
                    className={`mr-1.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} 
                    aria-hidden="true" 
                  />
                  <span className="text-xs font-medium">{feature.label}</span>
                  {isSelected && (
                    <FontAwesomeIcon 
                      icon={faCheck} 
                      className="ml-auto text-xs" 
                      aria-hidden="true" 
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Sort By Section */}
      <div className="mb-2">
        <button 
          className="w-full flex justify-between items-center font-bold mb-3 hover:text-soft-green transition-colors"
          onClick={() => toggleSection('sort')}
          aria-expanded={sectionsOpen.sort.toString()}
          aria-controls="sort-content"
        >
          <span className="flex items-center">
            <FontAwesomeIcon icon={faSort} className="mr-2 text-soft-green" />
            Sort By
          </span>
          <FontAwesomeIcon 
            icon={sectionsOpen.sort ? faChevronUp : faChevronDown} 
            className="text-sm text-gray-400" 
          />
        </button>
        
        {sectionsOpen.sort && (
          <div id="sort-content" className="space-y-0.5">
            {[
              { value: 'price-low', label: 'Price: Low to High', description: 'Lowest priced items first' },
              { value: 'price-high', label: 'Price: High to Low', description: 'Highest priced items first' },
              { value: 'rating', label: 'Highest Rated', description: 'Best customer ratings first' },
              { value: 'newest', label: 'Newest Arrivals', description: 'Recently added items first' },
              { value: 'bestselling', label: 'Best Sellers', description: 'Most popular items first' }
            ].map(option => (
              <button
                key={option.value}
                id={`sort-${option.value}`}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex flex-col ${
                  filters.sort === option.value
                    ? 'bg-soft-green bg-opacity-10 text-soft-green font-medium'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleSortChange(option.value)}
                aria-checked={(filters.sort === option.value).toString()}
                role="radio"
              >
                <span>{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterSidebar;
