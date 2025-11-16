import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Heart } from 'lucide-react';
import DonationForm from './DonationForm';

interface DonationModalProps {
  buttonText?: string;
  buttonClassName?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const DonationModal: React.FC<DonationModalProps> = ({
  buttonText = 'Donate Now',
  buttonClassName = '',
  buttonVariant = 'default',
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={buttonClassName}>
          <Heart className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Make a Donation</DialogTitle>
          <DialogDescription>
            Your contribution helps animals in need. Thank you for your support! All data is securely stored in Firebase.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <DonationForm />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DonationModal;
