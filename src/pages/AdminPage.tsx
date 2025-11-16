import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdminPanel from '@/components/admin/AdminPanel';
import { toast } from 'sonner';
import { auth } from '@/config/firebase';
import { isAdmin } from '@/utils/adminService';

const AdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Wait for auth to initialize
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user && user.email) {
            // Check if user is admin
            if (isAdmin(user.email)) {
              setHasAccess(true);
            } else {
              toast.error("Access denied: Admin privileges required");
              navigate('/');
            }
          } else {
            // Not logged in
            toast.error("Please log in with an admin account");
            navigate('/auth');
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error checking admin access:", error);
        setLoading(false);
        navigate('/');
      }
    };

    checkAdminAccess();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-amber-900">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-amber-50">
      <Header />
      
      <main className="flex-grow py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-900 mb-8">Admin Dashboard</h1>
          
          <AdminPanel />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminPage; 