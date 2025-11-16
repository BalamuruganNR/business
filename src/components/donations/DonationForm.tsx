import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { addDonation } from '@/services/donationService';
import { toast } from '@/hooks/use-toast';
import { DollarSign } from 'lucide-react';
import { auth } from '@/config/firebase';

const DonationForm: React.FC = () => {
  const [amount, setAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user if available
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
        setName(user.displayName || "");
        setEmail(user.email || "");
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAmountSelect = (selected: number) => {
    setAmount(selected);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      setCustomAmount("");
      setAmount(0);
      return;
    }
    
    // Only allow numbers and decimal point
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value)) {
      setCustomAmount(value);
      setAmount(parseFloat(value) || 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid donation amount",
        variant: "destructive"
      });
      return;
    }

    if (!anonymous && !name) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      await addDonation({
        name: anonymous ? "Anonymous" : name,
        email: anonymous ? undefined : email,
        amount,
        message,
        timestamp: new Date(),
        anonymous,
        userId: userId || undefined
      });
      
      toast({
        title: "Thank you for your donation!",
        description: "Your contribution will help animals in need.",
      });
      
      // Reset form
      setAmount(0);
      setCustomAmount("");
      setName("");
      setEmail("");
      setMessage("");
      setAnonymous(false);
    } catch (error) {
      console.error("Error submitting donation:", error);
      toast({
        title: "Error",
        description: "There was an error processing your donation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="block mb-2 font-medium">Select Amount</Label>
        <div className="grid grid-cols-3 gap-3">
          {[5, 10, 25, 50, 100, 250].map((value) => (
            <Button
              key={value}
              type="button"
              variant={amount === value ? "default" : "outline"}
              className="h-14"
              onClick={() => handleAmountSelect(value)}
            >
              ${value}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="customAmount" className="block mb-2 font-medium">Or Enter Custom Amount</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            id="customAmount"
            type="text"
            className="pl-9"
            placeholder="Enter amount"
            value={customAmount}
            onChange={handleCustomAmountChange}
          />
        </div>
      </div>
      
      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="anonymous" 
            checked={anonymous} 
            onCheckedChange={(checked) => setAnonymous(checked as boolean)}
          />
          <Label htmlFor="anonymous">Make this donation anonymous</Label>
        </div>
        
        {!anonymous && (
          <>
            <div className="grid gap-4 mb-4">
              <div>
                <Label htmlFor="name" className="block mb-1">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email" className="block mb-1">Email (optional)</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="message" className="block mb-1">Message (optional)</Label>
              <Textarea 
                id="message" 
                placeholder="Enter a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full py-6 text-lg" 
        disabled={loading}
      >
        {loading ? "Processing..." : `Donate $${amount || 0}`}
      </Button>
    </form>
  );
};

export default DonationForm;
