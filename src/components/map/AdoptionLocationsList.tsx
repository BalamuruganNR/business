import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cat } from 'lucide-react';

const AdoptionLocationsList: React.FC = () => {
  return (
    <div className="mt-6">
      <h2 className="font-semibold text-lg mb-3 flex items-center">
        <Cat className="mr-2 h-5 w-5 text-primary" />
        Pets Available for Adoption
      </h2>
      
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img 
                src={`https://source.unsplash.com/random/300x200?dog&sig=${i}`} 
                alt="Adoptable pet" 
                className="w-full h-40 object-cover"
              />
              <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                Adoptable
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium">Buddy {i}</h3>
              <p className="text-sm text-muted-foreground">{Math.round(Math.random() * 5) + 1} miles away • Golden Retriever</p>
              <Button variant="outline" size="sm" className="mt-2 w-full">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdoptionLocationsList;
