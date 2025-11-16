import React, { useState } from 'react';
import PlaceholderMap from './PlaceholderMap';
import SearchBox from './SearchBox';

const MapContainer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 mb-4">
        <SearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </div>
      
      <PlaceholderMap />
    </>
  );
};

export default MapContainer;
