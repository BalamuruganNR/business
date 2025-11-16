import React, { useState, useEffect } from 'react';
import { MapPin, MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import DonationCard from '../donations/DonationCard';
import { Link } from 'react-router-dom';
import DonationModal from '../donations/DonationModal';
import { getRecentDonations } from '@/services/donationService';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PlaceholderMap: React.FC = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const recentDonations = await getRecentDonations(3);
        setDonations(recentDonations);
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  // Sample placeholder data for when Firebase returns no results yet
  const placeholderDonations = [
    {
      id: 1,
      username: "John Smith",
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop",
      productName: "Premium Dog Food",
      productImage: "https://source.unsplash.com/random/300x300?dogfood",
      timestamp: "2 hours ago",
      amount: 25
    },
    {
      id: 2,
      username: "Sarah Miller",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
      productName: "Cat Toys Bundle",
      productImage: "https://source.unsplash.com/random/300x300?cattoys",
      timestamp: "Yesterday",
      amount: 15
    },
    {
      id: 3,
      username: "Alex Johnson",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop",
      productName: "Pet Beds",
      productImage: "https://source.unsplash.com/random/300x300?petbeds",
      timestamp: "3 days ago",
      amount: 45
    }
  ];

  // If no donations are retrieved from Firebase, use placeholder data
  const displayDonations = donations.length > 0 ? donations : (loading ? [] : placeholderDonations);

  return (
    <div className="bg-gradient-to-b from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/30 h-96 rounded-lg shadow-md relative overflow-hidden">
      <div className="absolute inset-0 p-4 flex flex-col">
        <div className="text-center mb-4">
          <MapPin className="h-12 w-12 mx-auto text-primary mb-2" />
          <h2 className="text-lg font-medium text-foreground">Recent Donations</h2>
          <p className="text-sm text-muted-foreground">Check out how people are helping animal shelters</p>
        </div>
        
        <ScrollArea className="flex-grow rounded-md">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border bg-card p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-40 w-full rounded-md" />
                  <div className="mt-2">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
              {displayDonations.map((donation, index) => (
                <DonationCard
                  key={donation.id || index}
                  username={donation.anonymous ? 'Anonymous' : (donation.name || 'Donor')}
                  avatarUrl={donation.avatarUrl}
                  productName={donation.productName || `$${donation.amount} Donation`}
                  productImage={donation.productImage || `https://source.unsplash.com/random/300x300?animal&sig=${index}`}
                  timestamp={typeof donation.timestamp === 'string' ? donation.timestamp : 'Recently'}
                  amount={donation.amount}
                />
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 text-center flex justify-center gap-3">
          <DonationModal buttonText="Make a Donation" />
          
          <Link to="/messages">
            <Button variant="outline">
              <div className="relative">
                <MessageSquare className="mr-2 h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]">5</Badge>
              </div>
              Message
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderMap;
