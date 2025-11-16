import { AnimalPost, User } from "./types";

export const currentUser: User = {
  id: "user1",
  username: "animal_lover",
  profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop"
};

export const mockPosts: AnimalPost[] = [
  {
    id: "post1",
    imageUrl: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?q=80&w=800&auto=format&fit=crop",
    description: "My adorable tabby cat enjoying the sunshine! 🐱☀️ #CatLife #SunnyDay",
    username: "cat_enthusiast",
    likes: 120,
    comments: 14,
    timestamp: "2 hours ago",
    species: "Cat"
  },
  {
    id: "post2",
    imageUrl: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?q=80&w=800&auto=format&fit=crop",
    description: "This little kitten just joined our family! Any name suggestions? 🐱💕 #NewFamily #KittyLove",
    username: "pet_parent",
    likes: 253,
    comments: 87,
    timestamp: "5 hours ago",
    species: "Cat"
  },
  {
    id: "post3",
    imageUrl: "https://images.unsplash.com/photo-1485833077593-4278bba3f11f?q=80&w=800&auto=format&fit=crop",
    description: "Spotted this beautiful deer on my morning hike 🦌 #Wildlife #NatureLover",
    username: "hiking_adventures",
    likes: 421,
    comments: 32,
    timestamp: "1 day ago",
    species: "Deer"
  },
  {
    id: "post4",
    imageUrl: "https://images.unsplash.com/photo-1441057206919-63d19fac2369?q=80&w=800&auto=format&fit=crop",
    description: "Penguins are such amazing creatures! Visited the sanctuary today 🐧 #PenguinLove #Conservation",
    username: "wildlife_watcher",
    likes: 198,
    comments: 21,
    timestamp: "2 days ago",
    species: "Penguin"
  }
];
