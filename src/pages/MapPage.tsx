import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MapContainer from '@/components/map/MapContainer';
import AdoptionLocationsList from '@/components/map/AdoptionLocationsList';

const MapPage: React.FC = () => {
  return (
    <div className="app-container min-h-screen">
      <Header />
      
      <main className="max-w-screen-sm mx-auto pt-6 px-4 pb-20">
        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Animal Adoption Map</h1>
        
        <MapContainer />
        <AdoptionLocationsList />
      </main>
      
      <Footer />
    </div>
  );
};

// This type declaration remains in the main file to maintain global scope
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default MapPage;
