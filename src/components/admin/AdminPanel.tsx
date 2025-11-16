import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Upload, ImageIcon, AlertTriangle, CheckCircle, Search, Shield, Award, UserSearch } from 'lucide-react';
import { auth, db } from '@/config/firebase';
import { isAdmin } from '@/utils/adminService';
import { addExtinctAnimal, addFeaturedAnimal } from '@/services/firebaseService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { collection, query, getDocs, doc, updateDoc, where, arrayUnion, arrayRemove } from 'firebase/firestore';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('featured');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedBadge, setSelectedBadge] = useState('');
  
  const [newFeaturedAnimal, setNewFeaturedAnimal] = useState({
    name: '',
    scientificName: '',
    category: 'land',
    description: '',
    conservationStatus: 'LC',
    habitat: '',
    isFeatured: true
  });

  const [newExtinctAnimal, setNewExtinctAnimal] = useState({
    name: '',
    scientificName: '',
    period: '',
    location: '',
    cause: '',
    description: '',
    category: 'land'
  });

  const conservationStatusOptions = [
    { value: 'LC', label: 'Least Concern' },
    { value: 'NT', label: 'Near Threatened' },
    { value: 'VU', label: 'Vulnerable' },
    { value: 'EN', label: 'Endangered' },
    { value: 'CR', label: 'Critically Endangered' },
    { value: 'EW', label: 'Extinct in the Wild' },
    { value: 'EX', label: 'Extinct' }
  ];

  const categoryOptions = [
    { value: 'land', label: 'Land Animals' },
    { value: 'marine', label: 'Marine Life' },
    { value: 'birds', label: 'Birds' },
    { value: 'insects', label: 'Insects' },
    { value: 'reptiles', label: 'Reptiles' },
    { value: 'amphibians', label: 'Amphibians' }
  ];

  // Badge options
  const badgeOptions = [
    { value: 'donor', label: 'Donor' },
    { value: 'supporter', label: 'Supporter' },
    { value: 'premium', label: 'Premium Donor' },
    { value: 'volunteer', label: 'Volunteer' },
    { value: 'rescuer', label: 'Animal Rescuer' },
    { value: 'verified', label: 'Verified' }
  ];

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !user.email) return;
        
        if (isAdmin(user.email)) {
          setIsAdminUser(true);
        } else {
          toast.error("You don't have admin privileges");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };
    
    checkAdmin();
  }, []);

  // Fetch users when user tab is selected
  useEffect(() => {
    if (activeTab === 'users' && isAdminUser) {
      fetchUsers();
    }
  }, [activeTab, isAdminUser]);

  // Filter users when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => 
        (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersData);
      setFilteredUsers(usersData);
      console.log('Fetched users:', usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Assign badge to user
  const assignBadge = async () => {
    if (!selectedUser || !selectedBadge) {
      toast.error('Please select a user and badge');
      return;
    }

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      
      // Add badge to user's badges array if it doesn't exist already
      await updateDoc(userRef, {
        badges: arrayUnion(selectedBadge)
      });
      
      // Update local state
      setUsers(users.map(user => {
        if (user.id === selectedUser.id) {
          const updatedBadges = user.badges ? 
            [...new Set([...user.badges, selectedBadge])] : 
            [selectedBadge];
          
          return {
            ...user,
            badges: updatedBadges
          };
        }
        return user;
      }));
      
      toast.success(`Badge "${selectedBadge}" assigned to ${selectedUser.displayName || selectedUser.username || selectedUser.email}`);
      
      // Reset selection
      setSelectedBadge('');
    } catch (error) {
      console.error('Error assigning badge:', error);
      toast.error('Failed to assign badge');
    }
  };

  // Remove badge from user
  const removeBadge = async (userId: string, badge: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        badges: arrayRemove(badge)
      });
      
      // Update local state
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            badges: user.badges.filter((b: string) => b !== badge)
          };
        }
        return user;
      }));
      
      toast.success(`Badge "${badge}" removed`);
    } catch (error) {
      console.error('Error removing badge:', error);
      toast.error('Failed to remove badge');
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Reset form and image
  const resetForm = (type: 'featured' | 'extinct') => {
    if (type === 'featured') {
      setNewFeaturedAnimal({
        name: '',
        scientificName: '',
        category: 'land',
        description: '',
        conservationStatus: 'LC',
        habitat: '',
        isFeatured: true
      });
    } else {
      setNewExtinctAnimal({
        name: '',
        scientificName: '',
        period: '',
        location: '',
        cause: '',
        description: '',
        category: 'land'
      });
    }
    
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add extinct animal
  const handleAddExtinctAnimal = async () => {
    if (!selectedImage) {
      toast.error("Please select an image");
      return;
    }

    if (!newExtinctAnimal.name || !newExtinctAnimal.description) {
      toast.error("Name and description are required");
      return;
    }

    setIsUploading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("You must be logged in as an admin");
        return;
      }
      
      const adminEmail = user.email;
      
      // Add the extinct animal
      await addExtinctAnimal(newExtinctAnimal, selectedImage, adminEmail);
      toast.success("New extinct species added successfully!");
      
      // Reset form
      resetForm('extinct');
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        toast.error("Admin privileges required to add species");
      } else {
        toast.error(error.message || "Failed to add new species");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Add featured animal
  const handleAddFeaturedAnimal = async () => {
    if (!selectedImage) {
      toast.error("Please select an image");
      return;
    }

    if (!newFeaturedAnimal.name || !newFeaturedAnimal.description) {
      toast.error("Name and description are required");
      return;
    }

    setIsUploading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("You must be logged in as an admin");
        return;
      }
      
      // Call the addFeaturedAnimal function
      await addFeaturedAnimal(newFeaturedAnimal, selectedImage, user.email);
      toast.success("New featured animal added successfully!");
      
      // Reset form
      resetForm('featured');
    } catch (error: any) {
      if (error.message.includes("Unauthorized")) {
        toast.error("Admin privileges required to add featured animals");
      } else {
        toast.error(error.message || "Failed to add featured animal");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Search for a specific user by ID or username
  const searchSpecificUser = async (term: string) => {
    if (!term.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setIsLoadingUsers(true);
    try {
      // Try to find by username first
      const usernameQuery = query(
        collection(db, 'users'), 
        where('username', '==', term)
      );
      
      let snapshot = await getDocs(usernameQuery);
      
      // If no results, try email
      if (snapshot.empty) {
        const emailQuery = query(
          collection(db, 'users'), 
          where('email', '==', term)
        );
        snapshot = await getDocs(emailQuery);
      }

      // If still no results, try contains
      if (snapshot.empty) {
        // Just use the full users list and filter on frontend
        setSearchQuery(term);
        toast.info('Searching for users containing: ' + term);
        return;
      }

      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setFilteredUsers(userData);
      
      if (userData.length === 1) {
        setSelectedUser(userData[0]);
      }
      
    } catch (error) {
      console.error('Error searching for user:', error);
      toast.error('Failed to search for user');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  if (!isAdminUser) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>
            This area is restricted to administrators only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You don't have permission to view this page. Please contact the system administrator if you believe this is an error.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>
          Manage content for Zoophi platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="featured">Featured Animals</TabsTrigger>
            <TabsTrigger value="extinct">Book of Extinction</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>
          
          {/* Featured Animal Tab */}
          <TabsContent value="featured">
            <Card>
              <CardHeader>
                <CardTitle>Add Featured Animal</CardTitle>
                <CardDescription>
                  Add a new animal to be featured on the homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {/* Image Upload Section */}
                    <div className="flex flex-col items-center justify-center space-y-2 p-4 border-2 border-dashed rounded-lg">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {imagePreview ? (
                        <div className="relative w-full max-w-xs">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-auto rounded-lg object-cover max-h-40"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="absolute top-2 right-2 bg-white/80"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={handleUploadClick} variant="outline" className="w-full max-w-xs">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Upload a high-quality image of the animal (JPG, PNG)
                      </p>
                    </div>
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Animal Name</Label>
                          <Input 
                            id="name"
                            placeholder="e.g. Bengal Tiger"
                            value={newFeaturedAnimal.name}
                            onChange={(e) => setNewFeaturedAnimal({...newFeaturedAnimal, name: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="scientificName">Scientific Name</Label>
                          <Input 
                            id="scientificName"
                            placeholder="e.g. Panthera tigris tigris"
                            value={newFeaturedAnimal.scientificName}
                            onChange={(e) => setNewFeaturedAnimal({...newFeaturedAnimal, scientificName: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={newFeaturedAnimal.category}
                            onValueChange={(value) => setNewFeaturedAnimal({...newFeaturedAnimal, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="conservationStatus">Conservation Status</Label>
                          <Select 
                            value={newFeaturedAnimal.conservationStatus}
                            onValueChange={(value) => setNewFeaturedAnimal({...newFeaturedAnimal, conservationStatus: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {conservationStatusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="habitat">Habitat</Label>
                        <Input 
                          id="habitat"
                          placeholder="e.g. Tropical forests, grasslands"
                          value={newFeaturedAnimal.habitat}
                          onChange={(e) => setNewFeaturedAnimal({...newFeaturedAnimal, habitat: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                          id="description"
                          placeholder="Enter detailed information about this animal..."
                          rows={5}
                          value={newFeaturedAnimal.description}
                          onChange={(e) => setNewFeaturedAnimal({...newFeaturedAnimal, description: e.target.value})}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="isFeatured"
                          checked={newFeaturedAnimal.isFeatured}
                          onCheckedChange={(checked) => setNewFeaturedAnimal({...newFeaturedAnimal, isFeatured: checked})}
                        />
                        <Label htmlFor="isFeatured">Feature on homepage</Label>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => resetForm('featured')}>
                  Reset
                </Button>
                <Button onClick={handleAddFeaturedAnimal} disabled={isUploading}>
                  {isUploading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Featured Animal
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Book of Extinction Tab */}
          <TabsContent value="extinct">
            <Card>
              <CardHeader>
                <CardTitle>Add to Book of Extinction</CardTitle>
                <CardDescription>
                  Add a new extinct species to the Book of Extinction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {/* Image Upload Section */}
                    <div className="flex flex-col items-center justify-center space-y-2 p-4 border-2 border-dashed rounded-lg">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {imagePreview ? (
                        <div className="relative w-full max-w-xs">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-auto rounded-lg object-cover max-h-40"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="absolute top-2 right-2 bg-white/80"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={handleUploadClick} variant="outline" className="w-full max-w-xs">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Image
                        </Button>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Upload a high-quality image of the extinct species (JPG, PNG)
                      </p>
                    </div>
                    
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="extinct-name">Species Name</Label>
                          <Input 
                            id="extinct-name"
                            placeholder="e.g. Tasmanian Tiger"
                            value={newExtinctAnimal.name}
                            onChange={(e) => setNewExtinctAnimal({...newExtinctAnimal, name: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="extinct-scientificName">Scientific Name</Label>
                          <Input 
                            id="extinct-scientificName"
                            placeholder="e.g. Thylacinus cynocephalus"
                            value={newExtinctAnimal.scientificName}
                            onChange={(e) => setNewExtinctAnimal({...newExtinctAnimal, scientificName: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="extinct-period">Time Period</Label>
                          <Input 
                            id="extinct-period"
                            placeholder="e.g. 1936"
                            value={newExtinctAnimal.period}
                            onChange={(e) => setNewExtinctAnimal({...newExtinctAnimal, period: e.target.value})}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="extinct-category">Category</Label>
                          <Select 
                            value={newExtinctAnimal.category}
                            onValueChange={(value) => setNewExtinctAnimal({...newExtinctAnimal, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="extinct-location">Geographic Location</Label>
                        <Input 
                          id="extinct-location"
                          placeholder="e.g. Tasmania, Australia"
                          value={newExtinctAnimal.location}
                          onChange={(e) => setNewExtinctAnimal({...newExtinctAnimal, location: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="extinct-cause">Cause of Extinction</Label>
                        <Input 
                          id="extinct-cause"
                          placeholder="e.g. Hunting, habitat loss"
                          value={newExtinctAnimal.cause}
                          onChange={(e) => setNewExtinctAnimal({...newExtinctAnimal, cause: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="extinct-description">Description</Label>
                        <Textarea 
                          id="extinct-description"
                          placeholder="Enter detailed information about this extinct species..."
                          rows={5}
                          value={newExtinctAnimal.description}
                          onChange={(e) => setNewExtinctAnimal({...newExtinctAnimal, description: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => resetForm('extinct')}>
                  Reset
                </Button>
                <Button onClick={handleAddExtinctAnimal} disabled={isUploading}>
                  {isUploading ? (
                    <>Loading...</>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add to Book of Extinction
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View all users, assign badges, and manage user roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Section */}
                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Button 
                      onClick={() => searchSpecificUser(searchQuery)}
                      disabled={isLoadingUsers || !searchQuery}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={fetchUsers}
                      disabled={isLoadingUsers}
                    >
                      Refresh List
                    </Button>
                  </div>
                  
                  {selectedUser && (
                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedUser.photoURL} alt={selectedUser.displayName || 'User'} />
                          <AvatarFallback>{(selectedUser.displayName || selectedUser.username || 'U')?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">{selectedUser.displayName || selectedUser.username || 'Anonymous User'}</h3>
                          <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                          {selectedUser.bio && <p className="text-sm mt-1">{selectedUser.bio}</p>}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedUser.badges && selectedUser.badges.map((badge: string) => (
                              <div key={badge} className="flex items-center gap-1">
                                <Badge variant="outline" className="bg-primary/10 text-primary">
                                  <Award className="h-3 w-3 mr-1" />
                                  {badge}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-5 w-5 rounded-full"
                                  onClick={() => removeBadge(selectedUser.id, badge)}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-4">
                        <Select 
                          value={selectedBadge} 
                          onValueChange={setSelectedBadge}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select badge" />
                          </SelectTrigger>
                          <SelectContent>
                            {badgeOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={assignBadge} disabled={!selectedBadge}>
                          <Award className="mr-2 h-4 w-4" />
                          Assign Badge
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setSelectedUser(null)}
                        >
                          Clear Selection
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* User List */}
                <div>
                  <h3 className="font-medium mb-2">Users ({filteredUsers.length})</h3>
                  {isLoadingUsers ? (
                    <div className="flex justify-center p-8">
                      <p>Loading users...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center p-8 border rounded-lg">
                      <UserSearch className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {filteredUsers.map(user => (
                          <div 
                            key={user.id} 
                            className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer hover:bg-muted ${selectedUser?.id === user.id ? 'bg-muted' : ''}`}
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />
                                <AvatarFallback>{(user.displayName || user.username || 'U')?.[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.displayName || user.username || 'Anonymous User'}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                {user.isAdmin && (
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 mt-1">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              {user.badges && user.badges.map((badge: string) => (
                                <Badge key={badge} variant="outline" className="bg-primary/10 text-primary">
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPanel; 