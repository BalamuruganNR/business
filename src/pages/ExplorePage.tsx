import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Users, Loader2, UserPlus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLocation, useNavigate } from 'react-router-dom';
import { collection, query, getDocs, where, limit, orderBy, doc, updateDoc, increment, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

// Define user type
interface User {
  id: string;
  uid?: string;
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  profilePic?: string;
  bio?: string;
  followers?: number;
  following?: number;
  isFollowing?: boolean;
}

const ExplorePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'users' | 'posts' | 'animals'>('all');
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingInProgress, setFollowingInProgress] = useState<string[]>([]);
  
  // Check if user is authenticated
  const isAuthenticated = !!auth.currentUser;
  
  // Parse search query from URL if present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [location.search]);
  
  const categories = [
    "Dogs", "Cats", "Birds", "Wildlife", "Rescue", "Adoption",
    "Pet Care", "Training", "Food", "Toys", "Health", "Exotic Animals"
  ];
  
  const allSearchResults = [
    {
      id: 1,
      type: 'animal',
      title: 'Golden Retriever',
      image: 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?q=80&w=300&auto=format&fit=crop',
      description: 'Friendly, loyal dog breed',
      category: 'Dogs'
    },
    {
      id: 2,
      type: 'post',
      title: 'Helping injured birds',
      image: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?q=80&w=300&auto=format&fit=crop',
      username: '@birdrescue',
      likes: 324,
      category: 'Birds'
    },
    {
      id: 3,
      type: 'user',
      username: 'animalover',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
      bio: 'Wildlife photographer',
      category: 'Wildlife'
    },
    {
      id: 4,
      type: 'animal',
      title: 'Persian Cat',
      image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=300&auto=format&fit=crop',
      description: 'Beautiful fluffy cat breed',
      category: 'Cats'
    }
  ];

  // Handle following a user
  const handleFollowUser = async (userId: string, isFollowed: boolean) => {
    try {
      if (!isAuthenticated) {
        toast.error("Please sign in to follow users");
        return;
      }
      
      // Add user ID to followingInProgress to show loading state
      setFollowingInProgress(prev => [...prev, userId]);
      
      const currentUserId = auth.currentUser?.uid;
      
      if (!currentUserId) {
        toast.error("Authentication error. Please sign in again.");
        return;
      }
      
      // Get the user document references
      const userToFollowRef = doc(db, "users", userId);
      const currentUserRef = doc(db, "users", currentUserId);
      
      // Check if the documents exist
      const userToFollowDoc = await getDoc(userToFollowRef);
      const currentUserDoc = await getDoc(currentUserRef);
      
      if (!userToFollowDoc.exists() || !currentUserDoc.exists()) {
        toast.error("User not found. Please try again.");
        return;
      }
      
      if (isFollowed) {
        // Unfollow: Remove from following list and decrement counters
        await updateDoc(currentUserRef, {
          following: increment(-1),
          followingList: arrayRemove(userId)
        });
        
        await updateDoc(userToFollowRef, {
          followers: increment(-1),
          followersList: arrayRemove(currentUserId)
        });
        
        toast.success("Unfollowed successfully");
      } else {
        // Follow: Add to following list and increment counters
        await updateDoc(currentUserRef, {
          following: increment(1),
          followingList: arrayUnion(userId)
        });
        
        await updateDoc(userToFollowRef, {
          followers: increment(1),
          followersList: arrayUnion(currentUserId)
        });
        
        toast.success("Followed successfully");
      }
      
      // Update the UI to reflect changes
      setFilteredResults(prev => 
        prev.map(result => 
          result.id === userId || result.uid === userId
            ? { ...result, isFollowing: !isFollowed }
            : result
        )
      );
      
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user. Please try again.");
    } finally {
      // Remove the user ID from followingInProgress
      setFollowingInProgress(prev => prev.filter(id => id !== userId));
    }
  };

  // Check if current user follows a specific user
  const checkIfFollowing = async (userId: string): Promise<boolean> => {
    try {
      if (!isAuthenticated || !auth.currentUser) return false;
      
      const currentUserRef = doc(db, "users", auth.currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      
      if (!currentUserDoc.exists()) return false;
      
      const userData = currentUserDoc.data();
      const followingList = userData.followingList || [];
      
      return followingList.includes(userId);
    } catch (error) {
      console.error("Error checking follow status:", error);
      return false;
    }
  };

  // Search users function
  const searchUsers = async (query: string) => {
    if (!query || query.trim() === '') return [];
    
    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      
      // Get all users and filter client-side for flexibility
      const snapshot = await getDocs(usersRef);
      
      // Filter results by search term across multiple fields
      const searchTermLower = query.toLowerCase();
      const users = snapshot.docs
        .map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            uid: userData.uid || doc.id,
            username: userData.username || '',
            displayName: userData.displayName || userData.username || '',
            email: userData.email || '',
            photoURL: userData.photoURL || userData.profilePic || '',
            profilePic: userData.profilePic || userData.photoURL || '',
            bio: userData.bio || '',
            followers: userData.followers || 0,
            following: userData.following || 0
          };
        })
        .filter(user => {
          // Don't show the current user in search results
          if (auth.currentUser && (user.uid === auth.currentUser.uid || user.id === auth.currentUser.uid)) {
            return false;
          }
          
          // Search across multiple fields
          return (
            user.username.toLowerCase().includes(searchTermLower) ||
            user.displayName.toLowerCase().includes(searchTermLower) ||
            user.email.toLowerCase().includes(searchTermLower) ||
            (user.uid && user.uid.toLowerCase().includes(searchTermLower)) ||
            (user.bio && user.bio.toLowerCase().includes(searchTermLower))
          );
        })
        .slice(0, 10); // Limit results to 10 users
      
      // Check follow status for each user
      const usersWithFollowStatus = await Promise.all(
        users.map(async (user) => {
          const isFollowing = await checkIfFollowing(user.id);
          return { ...user, isFollowing };
        })
      );
      
      console.log('User search results:', usersWithFollowStatus);
      return usersWithFollowStatus;
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users. Please try again.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search query
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set('q', searchQuery);
    navigate(`/explore?${queryParams.toString()}`);
    
    performSearch();
  };
  
  // Perform the search
  const performSearch = async () => {
    if (searchQuery.trim() === '' && !selectedCategory) {
      setFilteredResults([]);
      return;
    }
    
    setLoading(true);
    
    try {
      let results: any[] = [];
      
      // Search for users if search type is 'all' or 'users'
      if (searchType === 'all' || searchType === 'users') {
        const foundUsers = await searchUsers(searchQuery);
        results = [
          ...foundUsers.map(user => ({
            ...user,
            type: 'user',
            avatar: user.photoURL || user.profilePic,
            username: user.username || user.displayName,
            category: 'Users'
          }))
        ];
      }
      
      // Add other search results from the mock data
      if (searchType === 'all' || searchType === 'posts' || searchType === 'animals') {
        let mockResults = allSearchResults;
        
        // Filter by category if selected
        if (selectedCategory) {
          mockResults = mockResults.filter(item => item.category === selectedCategory);
        }
        
        // Filter by search query for non-user results
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          mockResults = mockResults.filter(item => {
            if (searchType === 'all' || searchType === item.type) {
              if (item.type === 'animal' || item.type === 'post') {
                return item.title.toLowerCase().includes(query);
              }
            }
            return false;
          });
        }
        
        // Only add mock results if we're not exclusively searching for users
        if (searchType !== 'users') {
          results = [...results, ...mockResults];
        }
      }
      
      setFilteredResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
      toast.error('An error occurred while searching. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Run search when component mounts or when search query changes
  useEffect(() => {
    if (searchQuery.trim() !== '' || selectedCategory) {
      performSearch();
    }
  }, [searchQuery, selectedCategory, searchType]);

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      // If no search query, this will show all items in the category
      if (searchQuery.trim() === '') {
        setSearchQuery(' ');
      }
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="app-container min-h-screen">
      <Header />
      
      <main className="max-w-screen-sm mx-auto pt-6 px-4 pb-20">
        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Explore</h1>
        
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search animals, posts, users..."
            className="pl-10 pr-10 py-6 bg-white dark:bg-card shadow-md"
          />
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </form>
        
        {/* Search type filter */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Badge 
              variant={searchType === 'all' ? "default" : "outline"}
              className="px-4 py-2 cursor-pointer"
              onClick={() => setSearchType('all')}
            >
              All
            </Badge>
            <Badge 
              variant={searchType === 'users' ? "default" : "outline"}
              className="px-4 py-2 cursor-pointer"
              onClick={() => setSearchType('users')}
            >
              <Users className="w-4 h-4 mr-1" />
              Users
            </Badge>
            <Badge 
              variant={searchType === 'posts' ? "default" : "outline"}
              className="px-4 py-2 cursor-pointer"
              onClick={() => setSearchType('posts')}
            >
              Posts
            </Badge>
            <Badge 
              variant={searchType === 'animals' ? "default" : "outline"}
              className="px-4 py-2 cursor-pointer"
              onClick={() => setSearchType('animals')}
            >
              Animals
            </Badge>
          </div>
        </div>
        
        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Popular Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, i) => (
              <Badge 
                key={i} 
                variant={selectedCategory === category ? "default" : "outline"}
                className={`px-4 py-2 cursor-pointer ${
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary hover:text-primary-foreground"
                } transition-colors`}
                onClick={() => handleCategorySelect(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Search results */}
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Searching...</span>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">
              Search Results {searchQuery && `for "${searchQuery}"`}
              {selectedCategory && !searchQuery && `in ${selectedCategory}`}
            </h2>
            <div className="space-y-4">
              {filteredResults.map(result => (
                <div 
                  key={result.id} 
                  className="bg-white dark:bg-card rounded-lg shadow-md overflow-hidden animate-fade-in"
                >
                  {result.type === 'animal' && (
                    <div className="flex">
                      <div className="w-24 h-24">
                        <img src={result.image} alt={result.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">{result.description}</p>
                      </div>
                    </div>
                  )}
                  
                  {result.type === 'post' && (
                    <div>
                      <img src={result.image} alt={result.title} className="w-full h-32 object-cover" />
                      <div className="p-3">
                        <h3 className="font-medium">{result.title}</h3>
                        <p className="text-xs text-muted-foreground">{result.username} • {result.likes} likes</p>
                      </div>
                    </div>
                  )}
                  
                  {result.type === 'user' && (
                    <div className="flex items-center p-4">
                      <div 
                        className="flex-grow flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2"
                        onClick={() => handleUserClick(result.uid || result.id)}
                      >
                        <Avatar className="h-12 w-12 rounded-full overflow-hidden mr-4">
                          <AvatarImage src={result.avatar || result.photoURL} alt={result.username} />
                          <AvatarFallback>{(result.username?.[0] || 'U').toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <h3 className="font-medium">{result.username}</h3>
                          {result.email && (
                            <p className="text-xs text-muted-foreground truncate">{result.email}</p>
                          )}
                          {result.bio && (
                            <p className="text-sm text-muted-foreground truncate">{result.bio}</p>
                          )}
                          {(result.followers !== undefined || result.following !== undefined) && (
                            <p className="text-xs text-muted-foreground">
                              {result.followers !== undefined && `${result.followers} followers`}
                              {result.followers !== undefined && result.following !== undefined && ' • '}
                              {result.following !== undefined && `${result.following} following`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={result.isFollowing ? "secondary" : "default"}
                        className="ml-auto min-w-24"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowUser(result.uid || result.id, !!result.isFollowing);
                        }}
                        disabled={followingInProgress.includes(result.uid || result.id) || !isAuthenticated}
                      >
                        {followingInProgress.includes(result.uid || result.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : result.isFollowing ? (
                          <><Check className="h-4 w-4 mr-1" /> Following</>
                        ) : (
                          <><UserPlus className="h-4 w-4 mr-1" /> Follow</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery ? (
          <div className="bg-white dark:bg-card rounded-lg shadow-md p-8 text-center mb-6">
            <p className="text-lg font-medium">No results found</p>
            <p className="text-muted-foreground mt-2">Try different keywords or browse categories</p>
          </div>
        ) : null}
        
        {/* Trending */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Trending Now</h2>
          <div className="grid grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white dark:bg-card rounded-lg shadow-md overflow-hidden">
                <div className="h-36 overflow-hidden">
                  <img
                    src={`https://source.unsplash.com/random/300x300?pet&sig=${i + 10}`}
                    alt="Trending post"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">Trending animal content</p>
                  <p className="text-xs text-muted-foreground mt-1">1.2K views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ExplorePage;
