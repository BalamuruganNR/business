import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimalPost from '@/components/AnimalPost';
import CreatePostButton from '@/components/CreatePostButton';
import { mockPosts } from '@/utils/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Index: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState(mockPosts);
  const [trendingPosts, setTrendingPosts] = useState<typeof mockPosts>([]);
  
  // Get user posts from localStorage if any
  useEffect(() => {
    const savedPosts = localStorage.getItem('zoophie-user-posts');
    if (savedPosts) {
      const parsedPosts = JSON.parse(savedPosts);
      // Combine mock posts with user posts
      setPosts([...parsedPosts, ...mockPosts]);
      
      // Set trending posts - these would be the most liked/viewed posts
      setTrendingPosts(mockPosts.slice(0, 3));
    }
  }, []);

  // Simulated infinite scroll
  const loadMorePosts = () => {
    if (loading) return;
    
    setLoading(true);
    // In a real app, this would fetch more posts from Firebase
    setTimeout(() => {
      setPosts([...posts, ...mockPosts.slice(0, 2)]);
      setLoading(false);
    }, 1000);
  };

  // Handle scroll for infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 100
      ) {
        loadMorePosts();
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts]);

  const filteredPosts = filter === 'all' 
    ? posts 
    : filter === 'adoptable' 
      ? posts.filter(post => post.adoptable) 
      : filter === 'trending'
      ? trendingPosts
      : posts.filter(post => post.species === filter);

  return (
    <div className="app-container min-h-screen">
      <Header />
      
      <main className="max-w-screen-sm mx-auto pt-6 px-4 pb-20">
        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Zoophi
        </h1>
        
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>All</TabsTrigger>
            <TabsTrigger value="trending" onClick={() => setFilter('trending')}>
              Trending
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">Hot</Badge>
            </TabsTrigger>
            <TabsTrigger value="adoptable" onClick={() => setFilter('adoptable')}>Adoptable</TabsTrigger>
            <TabsTrigger value="Dogs" onClick={() => setFilter('Dogs')}>Dogs</TabsTrigger>
            <TabsTrigger value="Cats" onClick={() => setFilter('Cats')}>Cats</TabsTrigger>
            <TabsTrigger value="Birds" onClick={() => setFilter('Birds')}>Birds</TabsTrigger>
            <TabsTrigger value="Exotic" onClick={() => setFilter('Exotic')}>Exotic</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {filteredPosts.length > 0 ? (
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <AnimalPost key={`${post.id}-${index}`} post={post} />
            ))}
            
            {loading && (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-lg text-muted-foreground">No posts yet!</p>
            <p className="text-sm mt-2">Share your animal photos by clicking the + button</p>
          </div>
        )}
      </main>
      
      <CreatePostButton />
      <Footer />
    </div>
  );
};

export default Index;
