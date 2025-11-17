import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, Filter, AlertTriangle, Upload } from 'lucide-react';
import { isAdmin } from '@/utils/adminService';
import { toast } from 'sonner';
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addExtinctAnimal } from '@/services/firebaseService';
import { auth } from '@/config/firebase';

// Added categories
const categories = [
  { id: 'all', name: 'All' },
  { id: 'land', name: 'Land Animals' },
  { id: 'marine', name: 'Marine Life' },
  { id: 'birds', name: 'Birds' },
  { id: 'insects', name: 'Insects' }
];

const extinctAnimals = [
  {
    id: 1,
    name: 'Dodo',
    scientificName: 'Raphus cucullatus',
    period: '17th century',
    location: 'Mauritius',
    cause: 'Hunting and invasive species',
    imageUrl: 'https://images.unsplash.com/photo-1579273175840-512f9e43f993?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZG9kb3xlbnwwfHwwfHx8MA%3D%3D',
    description: 'The dodo was a flightless bird endemic to the island of Mauritius, east of Madagascar. The dodo became extinct during the mid-to-late 17th century due to human activities.',
    category: 'birds'
  },
  {
    id: 2,
    name: 'Thylacine (Tasmanian Tiger)',
    scientificName: 'Thylacinus cynocephalus',
    period: '1936',
    location: 'Tasmania, Australia',
    cause: 'Hunting, habitat loss',
    imageUrl: 'https://source.unsplash.com/random/400x600?tiger',
    description: 'The thylacine was the largest known carnivorous marsupial of modern times. Native to Australia, Tasmania and New Guinea, it is believed to have become extinct in the 20th century.',
    category: 'land'
  },
  {
    id: 3,
    name: 'Passenger Pigeon',
    scientificName: 'Ectopistes migratorius',
    period: '1914',
    location: 'North America',
    cause: 'Hunting and habitat destruction',
    imageUrl: 'https://source.unsplash.com/random/400x600?pigeon',
    description: 'The passenger pigeon was endemic to North America. This pigeon was one of the most abundant birds in the world, with a population estimated at 3-5 billion individuals.',
    category: 'birds'
  },
  {
    id: 4,
    name: 'Steller\'s Sea Cow',
    scientificName: 'Hydrodamalis gigas',
    period: '1768',
    location: 'Bering Sea',
    cause: 'Overhunting',
    imageUrl: 'https://source.unsplash.com/random/400x600?sea',
    description: 'Steller\'s sea cow was a sirenian discovered in 1741. At that time, it was abundant in the North Pacific, but by 1768, less than 30 years later, it was extinct due to overhunting.',
    category: 'marine'
  },
  {
    id: 5,
    name: 'Great Auk',
    scientificName: 'Pinguinus impennis',
    period: '1844',
    location: 'North Atlantic',
    cause: 'Hunting for feathers and eggs',
    imageUrl: 'https://source.unsplash.com/random/400x600?penguin',
    description: 'The great auk was a flightless seabird that became extinct in the mid-19th century. It was hunted for its down feathers and eggs, which eventually led to its extinction.',
    category: 'birds'
  },
  {
    id: 6,
    name: 'Baiji (Yangtze River Dolphin)',
    scientificName: 'Lipotes vexillifer',
    period: '2006',
    location: 'Yangtze River, China',
    cause: 'Industrialization and fishing',
    imageUrl: 'https://source.unsplash.com/random/400x600?dolphin',
    description: 'The baiji was a freshwater dolphin native to the Yangtze River in China. It was declared functionally extinct in 2006 due to industrialization, dam building, and fishing practices.',
    category: 'marine'
  },
];

const BookOfExtinctionPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAnimal, setNewAnimal] = useState({
    name: '',
    scientificName: '',
    period: '',
    location: '',
    cause: '',
    description: '',
    category: 'land'
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter animals by category
  const filteredAnimals = selectedCategory === 'all' 
    ? extinctAnimals 
    : extinctAnimals.filter(animal => animal.category === selectedCategory);
  
  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Get current user from auth
        const user = auth.currentUser;
        if (!user) return;
        
        // Check if user is admin
        const userEmail = user.email;
        
        console.log("Checking admin status for email:", userEmail);
        
        if (userEmail && isAdmin(userEmail)) {
          console.log("Admin access granted for:", userEmail);
          setIsAdminMode(true);
          // Show welcome toast to admin
          toast.success(`Welcome, Admin! You have full access to the Book of Extinction.`);
        } else {
          console.log("Not an admin user");
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    };
    
    checkAdmin();
  }, []);

  const nextPage = () => {
    if (currentPage < filteredAnimals.length - 1) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 500);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, 500);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddSpecies = async () => {
    if (!selectedImage) {
      toast.error("Please select an image");
      return;
    }

    if (!newAnimal.name || !newAnimal.description) {
      toast.error("Name and description are required");
      return;
    }

    setIsUploading(true);

    try {
      // Get current user email for admin check
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("You must be logged in as an admin to add species");
        return;
      }
      
      const adminEmail = user.email;
      
      // Add the extinct animal with proper admin validation
      await addExtinctAnimal(newAnimal, selectedImage, adminEmail);
      toast.success("New extinct species added successfully!");
      setShowAddDialog(false);
      
      // Reset form
      setNewAnimal({
        name: '',
        scientificName: '',
        period: '',
        location: '',
        cause: '',
        description: '',
        category: 'land'
      });
      setSelectedImage(null);
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

  const currentAnimal = filteredAnimals[currentPage] || extinctAnimals[0];

  return (
    <div className="app-container min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-6 px-4 pb-20">
        <motion.h1 
          className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-primary via-red-500 to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Book of Extinction
        </motion.h1>
        
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p className="text-muted-foreground">
            Remembering the animals we've lost - a digital memorial to extinct species
          </p>
        </motion.div>
        
        {/* Category Filter */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="flex items-center mr-2">
            <Filter className="h-4 w-4 mr-1 text-muted-foreground" />
            <span className="text-sm">Filter:</span>
          </div>
          {categories.map((category) => (
            <Button 
              key={category.id}
              size="sm" 
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={selectedCategory === category.id ? "bg-primary" : ""}
              onClick={() => {
                setSelectedCategory(category.id);
                setCurrentPage(0);
              }}
            >
              {category.name}
            </Button>
          ))}
        </motion.div>
        
        {/* Admin Upload Button */}
        {isAdminMode && (
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" /> Admin: Add New Species
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Extinct Species</DialogTitle>
                  <DialogDescription>
                    Add a new species to the Book of Extinction database.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Species Name</Label>
                    <Input 
                      id="name" 
                      value={newAnimal.name}
                      onChange={(e) => setNewAnimal({...newAnimal, name: e.target.value})}
                      placeholder="e.g. Tasmanian Tiger"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scientificName">Scientific Name</Label>
                    <Input 
                      id="scientificName"
                      value={newAnimal.scientificName}
                      onChange={(e) => setNewAnimal({...newAnimal, scientificName: e.target.value})}
                      placeholder="e.g. Thylacinus cynocephalus"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period">Time Period</Label>
                      <Input 
                        id="period"
                        value={newAnimal.period}
                        onChange={(e) => setNewAnimal({...newAnimal, period: e.target.value})}
                        placeholder="e.g. 1936"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newAnimal.category}
                        onChange={(e) => setNewAnimal({...newAnimal, category: e.target.value})}
                      >
                        <option value="land">Land Animals</option>
                        <option value="marine">Marine Life</option>
                        <option value="birds">Birds</option>
                        <option value="insects">Insects</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Geographic Location</Label>
                    <Input 
                      id="location"
                      value={newAnimal.location}
                      onChange={(e) => setNewAnimal({...newAnimal, location: e.target.value})}
                      placeholder="e.g. Tasmania, Australia"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cause">Cause of Extinction</Label>
                    <Input 
                      id="cause"
                      value={newAnimal.cause}
                      onChange={(e) => setNewAnimal({...newAnimal, cause: e.target.value})}
                      placeholder="e.g. Hunting, habitat loss"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description"
                      rows={4}
                      value={newAnimal.description}
                      onChange={(e) => setNewAnimal({...newAnimal, description: e.target.value})}
                      placeholder="Enter detailed information about this species..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Species Image</Label>
                    <div
                      onClick={handleUpload}
                      className="border-2 border-dashed rounded-md border-primary/30 p-6 text-center cursor-pointer hover:bg-primary/5"
                    >
                      {selectedImage ? (
                        <div className="space-y-2">
                          <img 
                            src={URL.createObjectURL(selectedImage)} 
                            alt="Selected" 
                            className="max-h-48 mx-auto rounded-md object-contain"
                          />
                          <p className="text-sm">{selectedImage.name}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="h-10 w-10 text-primary/50" />
                          <p className="text-sm text-muted-foreground">Click to select an image</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                      />
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={handleAddSpecies} 
                    disabled={isUploading || !selectedImage || !newAnimal.name}
                  >
                    {isUploading ? "Uploading..." : "Add Species"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
        
        {/* Book */}
        <motion.div
          className="relative aspect-[16/10] max-w-3xl mx-auto bg-[url('/book-texture.jpg')]
               bg-cover rounded-lg shadow-2xl overflow-hidden border-4 border-amber-900/50"
          ref={bookRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          {/* Book spine */}
          <div className="absolute left-1/2 top-0 bottom-0 w-4 -ml-2 bg-amber-800 shadow-inner z-10"></div>
          
          {/* Page number tabs */}
          <div className="absolute right-4 bottom-4 flex gap-1 z-20">
            {filteredAnimals.map((_, index) => (
              <motion.div 
                key={index} 
                className={`w-3 h-3 rounded-full ${index === currentPage ? 'bg-primary' : 'bg-gray-300'}`}
                onClick={() => setCurrentPage(index)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              ></motion.div>
            ))}
          </div>
          
          {/* Current page content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              className="absolute inset-0 grid grid-cols-2 bg-amber-50"
              initial={{ opacity: 0, rotateY: -20 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Left page - Image */}
              <div className="relative p-6 border-r-2 border-amber-800/30">
                <motion.div
                  className="h-full w-full overflow-hidden rounded-lg shadow-xl"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <img 
                    src={currentAnimal.imageUrl} 
                    alt={currentAnimal.name} 
                    className="h-full w-full object-cover"
                  />
                  
                  {/* Category badge */}
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {categories.find(c => c.id === currentAnimal.category)?.name || 'Unknown'}
                  </div>
                </motion.div>
              </div>
              
              {/* Right page - Content */}
              <div className="p-8 font-serif flex flex-col justify-between bg-[url('/paper-texture.jpg')] bg-cover">
                <div>
                  <motion.h2 
                    className="text-2xl font-bold mb-2 text-amber-900"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    {currentAnimal.name}
                  </motion.h2>
                  
                  <motion.p 
                    className="text-sm italic text-amber-800 mb-4"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    {currentAnimal.scientificName}
                  </motion.p>
                  
                  <motion.div 
                    className="space-y-4 text-amber-950"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                  >
                    <p className="text-sm"><strong>Last Seen:</strong> {currentAnimal.period}</p>
                    <p className="text-sm"><strong>Location:</strong> {currentAnimal.location}</p>
                    <p className="text-sm"><strong>Cause of Extinction:</strong> {currentAnimal.cause}</p>
                    <p className="text-sm leading-relaxed">{currentAnimal.description}</p>
                  </motion.div>
                </div>
                
                <motion.div 
                  className="text-center text-amber-900/50 text-sm mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  Page {currentPage + 1} of {filteredAnimals.length}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation buttons overlaid on the book */}
          <div className="absolute inset-y-0 left-0 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={prevPage} 
              disabled={currentPage === 0 || isFlipping}
              className="h-12 w-12 rounded-full bg-white/80 text-amber-900"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={nextPage} 
              disabled={currentPage === filteredAnimals.length - 1 || isFlipping}
              className="h-12 w-12 rounded-full bg-white/80 text-amber-900"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </motion.div>
        
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <p className="mb-4 text-muted-foreground">
            <Info className="h-4 w-4 inline mr-1" />
            This book is curated by Zoophie administrators to raise awareness about extinct species.
          </p>
          <p className="text-sm text-muted-foreground">Contact us at vikashspidey@gmail.com to suggest additions to the Book of Extinction.</p>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookOfExtinctionPage;
