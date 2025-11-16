import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Dog, 
  ShoppingBag,
  Shirt,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import DonationModal from '@/components/donations/DonationModal';
import { getRecentDonations } from '@/services/donationService';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const DonationPage: React.FC = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const recentDonations = await getRecentDonations(10);
        setDonations(recentDonations);
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  const formatDate = (date: Date) => {
    if (!date) return 'Unknown date';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    // Less than a day
    else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    // Less than a week
    else if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
    // Otherwise show the date
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="app-container min-h-screen">
      <Header />
      
      <main className="max-w-screen-sm mx-auto pt-6 px-4 pb-20">
        <h1 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Make a Difference</h1>
        <p className="text-center text-muted-foreground mb-6">Support animal welfare through donations</p>
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-primary" />
            Financial Donations
          </h2>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Button variant="outline" className="h-14">$5</Button>
            <Button variant="outline" className="h-14">$10</Button>
            <Button variant="outline" className="h-14">$25</Button>
            <Button variant="outline" className="h-14">$50</Button>
            <Button variant="outline" className="h-14">$100</Button>
            <Button variant="outline" className="h-14">Other</Button>
          </div>
          
          <div className="mt-4 flex justify-between">
            <Button className="w-full">Donate Now</Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingBag className="mr-2 h-5 w-5 text-primary" />
                Food Donations
              </CardTitle>
              <CardDescription>Donate pet food to shelters</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Dry Dog & Cat Food
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Wet Food Cans
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Puppy & Kitten Formula
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Find Drop-off Locations</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shirt className="mr-2 h-5 w-5 text-primary" />
                Supply Donations
              </CardTitle>
              <CardDescription>Donate supplies for animals</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Blankets & Towels
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Toys & Enrichment Items
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Leashes & Collars
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">See Needed Items</Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Donations</h2>
          
          <div className="space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-border rounded-md">
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))
            ) : donations.length > 0 ? (
              donations.map((donation, i) => (
                <div key={i} className="flex justify-between items-center p-3 border border-border rounded-md">
                  <div>
                    <p className="font-medium">{donation.anonymous ? 'Anonymous' : donation.name || 'Donor'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(donation.timestamp)}</p>
                  </div>
                  <p className="font-semibold text-primary">${donation.amount}</p>
                </div>
              ))
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                <p>No donations yet. Be the first to donate!</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DonationPage;
