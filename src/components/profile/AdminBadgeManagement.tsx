import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Search,
  Award,
  Trophy,
  Shield,
  Crown,
  Heart,
  Camera,
  Leaf,
  Globe,
  MapPin,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { auth } from '@/config/firebase';
import { isAdmin } from '@/utils/adminService';
import { getUserProfile, grantBadgeToUser, removeBadgeFromUser } from '@/services/firebaseService';

// Available badges for admin to grant
const availableBadges = [
  { id: 'top-donor', name: 'Top Donor', icon: <Heart className="text-red-500" /> },
  { id: 'photographer', name: 'Wildlife Photographer', icon: <Camera className="text-blue-500" /> },
  { id: 'volunteer', name: 'Volunteer', icon: <Leaf className="text-green-500" /> },
  { id: 'conservationist', name: 'Conservationist', icon: <Globe className="text-emerald-500" /> },
  { id: 'adventurer', name: 'Wildlife Adventurer', icon: <MapPin className="text-orange-500" /> },
  { id: 'guardian', name: 'Animal Guardian', icon: <Shield className="text-indigo-500" /> },
  { id: 'champion', name: 'Champion', icon: <Trophy className="text-yellow-500" /> },
  { id: 'admin', name: 'Admin', icon: <Crown className="text-purple-500" /> }
];

const AdminBadgeManagement: React.FC = () => {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [targetUser, setTargetUser] = useState<any | null>(null);
  const [error, setError] = useState('');
  
  // Check if current user is admin
  const checkAdmin = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return;
      
      if (isAdmin(user.email)) {
        setIsAdminUser(true);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };
  
  useEffect(() => {
    checkAdmin();
  }, []);
  
  const handleSearchUser = async () => {
    if (!searchUserId.trim()) {
      toast.error("Please enter a user ID");
      return;
    }
    
    setLoading(true);
    setError('');
    setTargetUser(null);
    
    try {
      if (!auth.currentUser?.email) {
        toast.error("You must be logged in as an admin");
        return;
      }
      
      const userProfile = await getUserProfile(searchUserId);
      
      if (userProfile) {
        setTargetUser(userProfile);
      } else {
        setError("User not found");
        toast.error("User not found");
      }
    } catch (error: any) {
      console.error("Error searching for user:", error);
      setError(error.message || "Error searching for user");
      toast.error(error.message || "Error searching for user");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGrantBadge = async (badgeName: string) => {
    if (!targetUser) return;
    
    setLoading(true);
    
    try {
      if (!auth.currentUser?.email) {
        toast.error("You must be logged in as an admin");
        return;
      }
      
      await grantBadgeToUser(auth.currentUser.email, targetUser.uid, badgeName);
      
      // Update local state
      setTargetUser({
        ...targetUser,
        badges: [...(targetUser.badges || []), badgeName]
      });
      
      toast.success(`Badge "${badgeName}" granted to ${targetUser.username}`);
    } catch (error: any) {
      console.error("Error granting badge:", error);
      toast.error(error.message || "Error granting badge");
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveBadge = async (badgeName: string) => {
    if (!targetUser) return;
    
    setLoading(true);
    
    try {
      if (!auth.currentUser?.email) {
        toast.error("You must be logged in as an admin");
        return;
      }
      
      await removeBadgeFromUser(auth.currentUser.email, targetUser.uid, badgeName);
      
      // Update local state
      setTargetUser({
        ...targetUser,
        badges: (targetUser.badges || []).filter((badge: string) => badge !== badgeName)
      });
      
      toast.success(`Badge "${badgeName}" removed from ${targetUser.username}`);
    } catch (error: any) {
      console.error("Error removing badge:", error);
      toast.error(error.message || "Error removing badge");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAdminUser) {
    return null; // Only render for admin users
  }
  
  return (
    <div className="py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-amber-800">Admin Badge Management</CardTitle>
          <CardDescription>
            Add or remove badges for users as an administrator
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* User Search */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="user-id">User ID</Label>
                <Input 
                  id="user-id"
                  placeholder="Enter user ID"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  className="dark:bg-gray-800"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearchUser}
                  disabled={loading || !searchUserId.trim()}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center text-destructive gap-2">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
          
          {/* User Info and Badge Management */}
          {targetUser && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{targetUser.username}</h3>
                  <p className="text-sm text-muted-foreground">{targetUser.email}</p>
                </div>
                <Badge variant="outline" className="px-2 py-1">
                  ID: {targetUser.uid}
                </Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Current Badges:</h4>
                <div className="flex flex-wrap gap-2">
                  {targetUser.badges && targetUser.badges.length > 0 ? (
                    targetUser.badges.map((badge: string, index: number) => (
                      <div key={index} className="flex items-center rounded-full px-3 py-1 text-xs bg-yellow-50 text-yellow-800">
                        <Award className="h-3 w-3 mr-1" />
                        <span className="mr-2">{badge}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={() => handleRemoveBadge(badge)}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No badges assigned</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Add Badge:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {availableBadges.map((badge) => (
                    <Button
                      key={badge.id}
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-start h-auto px-2 py-1 gap-2"
                      disabled={targetUser.badges?.includes(badge.name)}
                      onClick={() => handleGrantBadge(badge.name)}
                    >
                      <div className="flex items-center">
                        {badge.icon}
                        <span className="ml-1">{badge.name}</span>
                      </div>
                      {targetUser.badges?.includes(badge.name) ? (
                        <Check className="h-3 w-3 ml-auto text-green-500" />
                      ) : null}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-between text-xs text-muted-foreground">
          <p>Admin tools are only visible to administrators</p>
          <p>User ID: {auth.currentUser?.uid}</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminBadgeManagement; 