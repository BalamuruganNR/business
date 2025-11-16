import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  PhoneAuthProvider,
  signInWithCredential,
  PhoneAuthCredential,
  FacebookAuthProvider
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../config/firebase";
import { User, AnimalPost, Donation } from "@/utils/types";
import { ADMIN_EMAILS } from "@/utils/adminService";

// Authentication Services
export const registerUser = async (email: string, password: string, username: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, {
      displayName: username
    });

    // Create user profile in Firestore
    await createUserProfile(userCredential.user, {
      username,
      authProvider: 'email'
    });

    // Send email verification
    await sendEmailVerification(userCredential.user);

    return userCredential.user;
  } catch (error) {
    console.error("Error registering user: ", error);
    throw error;
  }
};

// Helper function to create or update user profile in Firestore
export const createUserProfile = async (user: FirebaseUser, additionalData: any = {}) => {
  if (!user) return;

  try {
    // Check if user already exists
    const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      // Create new user profile
      const userData = {
        uid: user.uid,
        username: additionalData.username || user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        profilePic: user.photoURL || '',
        bio: '',
        badges: [],
        followers: 0,
        following: 0,
        joinDate: serverTimestamp(),
        donationsMade: 0,
        adoptions: 0,
        isCollaborator: false,
        verified: user.emailVerified,
        authProvider: additionalData.authProvider || 'unknown',
        lastLogin: serverTimestamp()
      };
      
      await addDoc(collection(db, "users"), userData);
    } else {
      // Update existing user profile with last login
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        lastLogin: serverTimestamp(),
        verified: user.emailVerified,
        // Update any additional fields if provided
        ...(additionalData.username && { username: additionalData.username }),
        ...(user.photoURL && { profilePic: user.photoURL })
      });
    }
  } catch (error) {
    console.error("Error creating/updating user profile: ", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Create or update user profile
    await createUserProfile(userCredential.user);
    
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in: ", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add custom parameters to fix cross-origin issues
    provider.setCustomParameters({
      prompt: 'select_account',
      // Helps prevent the popup from being blocked
      login_hint: 'user@example.com'
    });
    
    // Try to sign in with redirect instead of popup if popup fails
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupError) {
      console.log("Popup blocked or failed, trying redirect...", popupError);
      // If popup is blocked, try redirect method
      await signInWithRedirect(auth, provider);
      return null; // This will redirect the page
    }
    
    // Get the profile photo URL from Google account
    const photoURL = result.user.photoURL;
    
    // Create or update user profile with Google profile picture
    await createUserProfile(result.user, {
      authProvider: 'google',
      profilePic: photoURL
    });
    
    // Update profile with the photo URL
    if (photoURL && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: photoURL
      });
    }
    
    return result.user;
  } catch (error) {
    console.error("Error with Google sign in: ", error);
    throw error;
  }
};

export const signInWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    // Request minimal permissions - no photo access
    provider.addScope('email');
    provider.addScope('public_profile');
    
    const result = await signInWithPopup(auth, provider);
    
    // Create or update user profile without Facebook profile picture
    await createUserProfile(result.user, {
      authProvider: 'facebook'
    });
    
    // Reset any photoURL that might have been set from Facebook
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: null
      });
    }
    
    return result.user;
  } catch (error) {
    console.error("Error with Facebook sign in: ", error);
    throw error;
  }
};

export const signInWithPhone = async (credential: PhoneAuthCredential) => {
  try {
    const result = await signInWithCredential(auth, credential);
    
    // Create or update user profile
    await createUserProfile(result.user, {
      authProvider: 'phone'
    });
    
    return result.user;
  } catch (error) {
    console.error("Error with phone sign in: ", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error logging out: ", error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email: ", error);
    throw error;
  }
};

export const changeEmail = async (newEmail: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in");
    
    await updateEmail(user, newEmail);
    
    // Update email in Firestore
    const userQuery = query(collection(db, "users"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(userQuery);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error changing email: ", error);
    throw error;
  }
};

export const changePassword = async (newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in");
    
    await updatePassword(user, newPassword);
    return true;
  } catch (error) {
    console.error("Error changing password: ", error);
    throw error;
  }
};

export const resendVerificationEmail = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is currently signed in");
    
    await sendEmailVerification(user);
    return true;
  } catch (error) {
    console.error("Error sending verification email: ", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise<FirebaseUser | null>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
};

// User Profile Services
export const updateUserProfile = async (userId: string, userData: Partial<User>) => {
  try {
    const userQuery = query(collection(db, "users"), where("uid", "==", userId));
    const querySnapshot = await getDocs(userQuery);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "users", userDoc.id), {
        ...userData,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error("Error updating user profile: ", error);
    throw error;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userQuery = query(collection(db, "users"), where("uid", "==", userId));
    const querySnapshot = await getDocs(userQuery);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return { 
        id: userDoc.id, 
        uid: userData.uid || userId,
        username: userData.username || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber,
        profilePic: userData.profilePic,
        bio: userData.bio || '',
        badges: userData.badges || [],
        followers: userData.followers || 0,
        following: userData.following || 0,
        joinDate: userData.joinDate,
        donationsMade: userData.donationsMade || 0,
        adoptions: userData.adoptions || 0,
        isCollaborator: userData.isCollaborator || false,
        verified: userData.verified || false,
        authProvider: userData.authProvider,
        lastLogin: userData.lastLogin,
        scheduledForDeletion: userData.scheduledForDeletion || false,
        deletionDate: userData.deletionDate,
        isAdmin: userData.isAdmin || false,
        updatedAt: userData.updatedAt
      };
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile: ", error);
    throw error;
  }
};

// Post Services
export const addPost = async (postData: Partial<AnimalPost>, imageFile: File) => {
  try {
    // Upload image
    const storageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(uploadResult.ref);
    
    // Add post to Firestore
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      imageUrl: imageUrl,
      likes: 0,
      comments: 0,
      timestamp: serverTimestamp(),
      views: 0
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding post: ", error);
    throw error;
  }
};

export const getRecentPosts = async (limit_count: number = 10) => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("timestamp", "desc"),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(postsQuery);
    const posts: any[] = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null
      });
    });
    
    return posts;
  } catch (error) {
    console.error("Error fetching posts: ", error);
    throw error;
  }
};

export const getTrendingPosts = async (limit_count: number = 5) => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("views", "desc"),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(postsQuery);
    const posts: any[] = [];
    
    querySnapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data(),
        trending: true,
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null
      });
    });
    
    return posts;
  } catch (error) {
    console.error("Error fetching trending posts: ", error);
    throw error;
  }
};

// Donation Services - keeping existing functionality but enhancing
export const addDonation = async (donationData: Partial<Donation>) => {
  try {
    const docRef = await addDoc(collection(db, "donations"), {
      ...donationData,
      timestamp: serverTimestamp()
    });
    
    // Update user's donation count if userId is provided
    if (donationData.userId) {
      const userQuery = query(collection(db, "users"), where("uid", "==", donationData.userId));
      const querySnapshot = await getDocs(userQuery);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          donationsMade: (userDoc.data().donationsMade || 0) + 1
        });
      }
    }
    
    console.log("Donation added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding donation: ", error);
    throw error;
  }
};

export const getRecentDonations = async (limit_count: number = 5) => {
  try {
    const donationsQuery = query(
      collection(db, "donations"), 
      orderBy("timestamp", "desc"), 
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(donationsQuery);
    const donations: any[] = [];
    
    querySnapshot.forEach((doc) => {
      donations.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null
      });
    });
    
    return donations;
  } catch (error) {
    console.error("Error fetching donations: ", error);
    throw error;
  }
};

// Extinction Book Services - Admin only
export const addExtinctAnimal = async (animalData: any, imageFile: File, adminEmail: string) => {
  try {
    // Check if user is admin
    const usersQuery = query(collection(db, "users"), where("email", "==", adminEmail), where("isAdmin", "==", true));
    const usersSnapshot = await getDocs(usersQuery);
    
    // Also check against the admin emails list
    const isAdminEmail = ADMIN_EMAILS.includes(adminEmail.toLowerCase());
    
    if (usersSnapshot.empty && !isAdminEmail) {
      throw new Error("Unauthorized: Only admins can add to the Book of Extinction");
    }
    
    // Upload image
    const storageRef = ref(storage, `extinction/${Date.now()}_${imageFile.name}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(uploadResult.ref);
    
    // Add animal to Firestore
    const docRef = await addDoc(collection(db, "extinctAnimals"), {
      ...animalData,
      imageUrl: imageUrl,
      addedBy: adminEmail,
      timestamp: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding extinct animal: ", error);
    throw error;
  }
};

export const getExtinctAnimals = async () => {
  try {
    const animalsQuery = query(
      collection(db, "extinctAnimals"), 
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(animalsQuery);
    const animals: any[] = [];
    
    querySnapshot.forEach((doc) => {
      animals.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null
      });
    });
    
    return animals;
  } catch (error) {
    console.error("Error fetching extinct animals: ", error);
    throw error;
  }
};

// Admin Services - Badge Management
export const grantBadgeToUser = async (adminEmail: string, targetUserId: string, badgeName: string) => {
  try {
    // First check if the user performing the action is an admin
    const usersAdminQuery = query(collection(db, "users"), where("email", "==", adminEmail), where("isAdmin", "==", true));
    const adminSnapshot = await getDocs(usersAdminQuery);
    
    if (adminSnapshot.empty) {
      throw new Error("Unauthorized: Only admins can grant badges");
    }
    
    // Find the target user
    const userQuery = query(collection(db, "users"), where("uid", "==", targetUserId));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      throw new Error("User not found");
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Get existing badges or create empty array
    const currentBadges = userData.badges || [];
    
    // Check if badge already exists
    if (currentBadges.includes(badgeName)) {
      throw new Error(`User already has the "${badgeName}" badge`);
    }
    
    // Add new badge
    const updatedBadges = [...currentBadges, badgeName];
    
    // Update user document
    await updateDoc(doc(db, "users", userDoc.id), {
      badges: updatedBadges,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: `Badge "${badgeName}" granted successfully`
    };
  } catch (error) {
    console.error("Error granting badge:", error);
    throw error;
  }
};

// Featured Animals Admin Service
export const addFeaturedAnimal = async (animalData: any, imageFile: File, adminEmail: string) => {
  try {
    // Verify admin status
    const usersQuery = query(collection(db, "users"), where("email", "==", adminEmail), where("isAdmin", "==", true));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      throw new Error("Unauthorized: Only admins can add featured animals");
    }
    
    // Upload image to storage
    const storageRef = ref(storage, `featured/${Date.now()}_${imageFile.name}`);
    const uploadResult = await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(uploadResult.ref);
    
    // Add animal data to Firestore
    const docRef = await addDoc(collection(db, "featuredAnimals"), {
      ...animalData,
      imageUrl: imageUrl,
      addedBy: adminEmail,
      timestamp: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Error adding featured animal: ", error);
    throw error;
  }
};

export const getFeaturedAnimals = async (limit_count: number = 10) => {
  try {
    const featuredQuery = query(
      collection(db, "featuredAnimals"),
      where("isFeatured", "==", true),
      orderBy("timestamp", "desc"),
      limit(limit_count)
    );
    
    const querySnapshot = await getDocs(featuredQuery);
    const animals: any[] = [];
    
    querySnapshot.forEach((doc) => {
      animals.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null
      });
    });
    
    return animals;
  } catch (error) {
    console.error("Error fetching featured animals: ", error);
    throw error;
  }
};

export const removeBadgeFromUser = async (adminEmail: string, targetUserId: string, badgeName: string) => {
  try {
    // First check if the user performing the action is an admin
    const usersAdminQuery = query(collection(db, "users"), where("email", "==", adminEmail), where("isAdmin", "==", true));
    const adminSnapshot = await getDocs(usersAdminQuery);
    
    if (adminSnapshot.empty) {
      throw new Error("Unauthorized: Only admins can remove badges");
    }
    
    // Find the target user
    const userQuery = query(collection(db, "users"), where("uid", "==", targetUserId));
    const querySnapshot = await getDocs(userQuery);
    
    if (querySnapshot.empty) {
      throw new Error("User not found");
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    // Get existing badges
    const currentBadges = userData.badges || [];
    
    // Check if badge exists
    if (!currentBadges.includes(badgeName)) {
      throw new Error(`User does not have the "${badgeName}" badge`);
    }
    
    // Remove badge
    const updatedBadges = currentBadges.filter(badge => badge !== badgeName);
    
    // Update user document
    await updateDoc(doc(db, "users", userDoc.id), {
      badges: updatedBadges,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      message: `Badge "${badgeName}" removed successfully`
    };
  } catch (error) {
    console.error("Error removing badge:", error);
    throw error;
  }
};
