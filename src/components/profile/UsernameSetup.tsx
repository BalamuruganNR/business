import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { updateUserProfile } from '@/services/firebaseService';
import { auth } from '@/config/firebase';
import { updateProfile } from 'firebase/auth';
import { Textarea } from '@/components/ui/textarea';

interface UsernameSetupProps {
  onComplete: () => void;
}

const UsernameSetup: React.FC<UsernameSetupProps> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username) {
      toast.error('Please enter a username');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Update the Firebase Auth profile
      await updateProfile(user, {
        displayName: username
      });
      
      // Update the Firestore user profile
      await updateUserProfile(user.uid, {
        username,
        bio: bio || ''
      });
      
      toast.success('Profile set up successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.message || 'Failed to set up profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background/80 to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Choose a username and add some details about yourself
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username <span className="text-red-500">*</span></Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-input rounded-l-md bg-muted">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </span>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="rounded-l-none"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your username will be visible to other users
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={loading}
                className="h-24 resize-none"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-muted-foreground">
            You can update these details later in your profile settings
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UsernameSetup; 