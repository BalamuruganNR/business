import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Check, Gift } from 'lucide-react';

interface DonationCardProps {
  username: string;
  avatarUrl?: string;
  productName: string;
  productImage: string;
  timestamp: string;
  amount?: number;
}

const DonationCard: React.FC<DonationCardProps> = ({
  username,
  avatarUrl,
  productName,
  productImage,
  timestamp,
  amount
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{username.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-muted-foreground">{timestamp}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <div className="aspect-square overflow-hidden rounded-md">
          <img 
            src={productImage} 
            alt={productName} 
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex-col items-start">
        <p className="text-sm font-medium">{productName}</p>
        {amount && (
          <Badge className="mt-1 bg-primary" variant="default">
            <Gift className="h-3 w-3 mr-1" /> ${amount}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default DonationCard;