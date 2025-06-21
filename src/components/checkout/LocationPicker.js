import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faLocationCrosshairs, faSpinner, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

// Fix for default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const defaultCenter = {
  lat: -1.286389,
  lng: 36.817223,
}; // Centered on Nairobi

// Component to programmatically update map view
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Component to handle the draggable marker and map clicks
function LocationMarker({ position, setPosition, onGeocode }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onGeocode(e.latlng);
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          onGeocode(newPos);
        }
      },
    }),
    [onGeocode, setPosition],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

const LocationPicker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(defaultCenter);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reverseGeocode = useCallback(async (latlng) => {
    if (!latlng) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        onLocationSelect(latlng, data.display_name);
      } else {
        onLocationSelect(latlng, 'Address not found');
        setError('Could not find address for this location.');
      }
    } catch (err) {
      console.error('Error fetching address:', err);
      onLocationSelect(latlng, 'Could not determine address');
      setError('Failed to fetch address. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect]);

  // Initial geocode on component mount
  useEffect(() => {
    reverseGeocode(defaultCenter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError('');
    setSearchResults([]);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ke`);
      const data = await response.json();
      if (data.length === 0) {
        setError('No results found for your search.');
      }
      setSearchResults(data);
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchResultClick = (result) => {
    const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    setPosition(newPos);
    reverseGeocode(newPos);
    setSearchQuery(result.display_name);
    setSearchResults([]);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        reverseGeocode(newPos);
      },
      (err) => {
        setError('Failed to get your location. Please enable location services and try again.');
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="flex-grow relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for an area or building..."
            className="w-full pl-4 pr-10 py-3 bg-white rounded-full border-2 border-gray-200 focus:border-rich-brown focus:ring-0 transition-all duration-300 shadow-sm"
          />
          <button type="submit" disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 text-rich-brown/70 hover:text-rich-brown transition-colors">
            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
          </button>
        </form>
        <button 
          onClick={handleUseMyLocation} 
          disabled={isLoading}
          className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center px-4 py-3 bg-soft-green text-white font-bold rounded-full hover:bg-rich-brown transition-all duration-300 shadow-lg transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} className="mr-2" />
          Use My Location
        </button>
      </div>

      {error && <p className="text-sm text-red-600 font-medium text-center">{error}</p>}

      {searchResults.length > 0 && (
        <ul className="bg-white border border-gray-200 rounded-lg shadow-md max-h-48 overflow-y-auto">
          {searchResults.map(result => (
            <li 
              key={result.place_id} 
              onClick={() => handleSearchResultClick(result)}
              className="px-4 py-3 cursor-pointer hover:bg-soft-green/20 border-b last:border-b-0 flex items-start gap-3"
            >
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-rich-brown/60 mt-1" />
              <span className="text-sm">{result.display_name}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl overflow-hidden shadow-lg border-2 border-gray-200 focus-within:border-rich-brown transition-all duration-300">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: '350px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={position} />
          <LocationMarker position={position} setPosition={setPosition} onGeocode={reverseGeocode} />
        </MapContainer>
      </div>
    </div>
  );
};

export default memo(LocationPicker);
