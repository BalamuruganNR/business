import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderTree, Award, Users, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const CollabPage: React.FC = () => {
  const [followStatus, setFollowStatus] = useState<Record<number, boolean>>({
    1: false,
    2: false
  });

  const handleFollow = (id: number) => {
    setFollowStatus(prev => {
      const newStatus = {...prev, [id]: !prev[id]};
      
      // Show a toast notification
      if (newStatus[id]) {
        toast.success("Successfully followed collaborator");
      } else {
        toast("Unfollowed collaborator");
      }
      
      return newStatus;
    });
  };

  const collaborators = [
    {
      id: 1,
      name: "Animal Rescue Foundation",
      avatar: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=100&auto=format&fit=crop",
      followers: 12540,
      verified: true,
      description: "Saving animals one life at a time. We rescue, rehabilitate and rehome animals in need.",
      posts: [
        {
          id: 101,
          image: "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?q=80&w=400&auto=format&fit=crop",
          title: "Rescued puppies ready for adoption!",
          likes: 453
        }
      ]
    },
    {
      id: 2,
      name: "Wildlife Protection Society",
      avatar: "https://images.unsplash.com/photo-1551022372-0bdac482b9d6?q=80&w=100&auto=format&fit=crop",
      followers: 8920,
      verified: true,
      description: "Dedicated to the conservation of wildlife and their habitats through education and direct action.",
      posts: [
        {
          id: 201,
          image: "https://images.unsplash.com/photo-1507666664345-c49224686536?q=80&w=400&auto=format&fit=crop",
          title: "Our team releasing rehabilitated eagles back to the wild",
          likes: 782
        }
      ]
    }
  ];

  return (
    <div className="app-container min-h-screen">
      <Header />
      
      <main className="max-w-screen-sm mx-auto pt-6 px-4 pb-20">
        <div className="flex items-center justify-center mb-6">
          <FolderTree className="h-6 w-6 text-primary mr-2" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Collaborators
          </h1>
        </div>
        
        <div className="bg-white dark:bg-card rounded-lg shadow-md p-4 mb-6">
          <p className="text-center text-sm text-muted-foreground">
            Follow animal activists and organizations making a difference for animals around the world
          </p>
        </div>
        
        <div className="space-y-6">
          {collaborators.map(collab => (
            <div key={collab.id} className="bg-white dark:bg-card rounded-lg shadow-md overflow-hidden">
              {/* Collab header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center">
                  <Avatar className="h-14 w-14 mr-4">
                    <img src={collab.avatar} alt={collab.name} className="h-full w-full object-cover" />
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="font-bold">{collab.name}</h3>
                      {collab.verified && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          <Award className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      {collab.followers.toLocaleString()} followers
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant={followStatus[collab.id] ? "secondary" : "default"}
                    onClick={() => handleFollow(collab.id)}
                  >
                    {followStatus[collab.id] ? "Following" : "Follow"}
                  </Button>
                </div>
                
                <p className="mt-3 text-sm">{collab.description}</p>
              </div>
              
              {/* Collab posts */}
              <div className="p-4">
                <h4 className="font-medium mb-3">Recent Activity</h4>
                
                {collab.posts.map(post => (
                  <div key={post.id} className="border border-border rounded-lg overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-48 object-cover" />
                    <div className="p-3">
                      <p className="font-medium">{post.title}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Heart className="h-4 w-4 mr-1 text-accent" />
                          {post.likes} likes
                        </div>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CollabPage;
