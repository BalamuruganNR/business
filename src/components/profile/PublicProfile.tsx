import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getUserProfile } from '@/services/firebaseService';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface PublicProfileProps {
  userId: string;
}

const PublicProfile: React.FC<PublicProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadProfile();
  }, [userId]);
  
  const loadProfile = async () => {
    setLoading(true);
    try {
      const userProfile = await getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
      } else {
        setError('Profile not found');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const shareProfile = () => {
    const profileUrl = window.location.href;
    
    // If available, use the Web Share API
    if (navigator.share) {
      navigator.share({
        title: `${profile.username}'s Profile`,
        text: `Check out ${profile.username}'s profile on Zoophie`,
        url: profileUrl,
      })
      .catch((error) => {
        console.error('Error sharing', error);
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(profileUrl).then(
        () => {
          toast.success('Profile link copied to clipboard');
        },
        () => {
          toast.error('Failed to copy link');
        }
      );
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Error</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <p className="text-lg font-medium">Profile not found</p>
          <p className="mt-2 text-sm text-muted-foreground">The user profile you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }
  
  // Get the first letter of the username for the avatar fallback
  const avatarFallback = profile.username ? profile.username.charAt(0).toUpperCase() : 'U';
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader className="relative">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={shareProfile}
              title="Share profile"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-24 w-24 mb-4 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {profile.profilePic ? (
                <img 
                  src={profile.profilePic} 
                  alt={profile.username} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold">{avatarFallback}</span>
              )}
            </div>
            
            <CardTitle className="text-2xl font-bold">{profile.username}</CardTitle>
            
            <div className="flex items-center gap-4 mt-2">
              {profile.badges && profile.badges.length > 0 && (
                <div className="flex gap-1">
                  {profile.badges.map((badge: string, index: number) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary-foreground"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              
              {profile.verified && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Verified
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-semibold">{profile.followers || 0}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-semibold">{profile.following || 0}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-semibold">{profile.adoptions || 0}</p>
                <p className="text-sm text-muted-foreground">Adoptions</p>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {profile.bio ? (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Bio</h3>
              <p className="text-sm">{profile.bio}</p>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground italic mt-6">
              This user hasn't added a bio yet.
            </p>
          )}
          
          <div className="mt-8 pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Stats</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Donations</p>
                <p className="text-xl font-semibold mt-1">{profile.donationsMade || 0}</p>
              </div>
              
              <div className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm font-semibold mt-1">
                  {profile.joinDate 
                    ? new Date(profile.joinDate.seconds * 1000).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long'
                      })
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicProfile; 