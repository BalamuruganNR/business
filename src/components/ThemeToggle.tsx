import React, { useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const { toast } = useToast();

  // Check user's preference on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('zoophie-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('zoophie-theme', 'dark');
      toast({
        title: "Dark mode enabled",
        description: "Your eyes will thank you at night!",
      });
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('zoophie-theme', 'light');
      toast({
        title: "Light mode enabled",
        description: "Bright and cheerful!",
      });
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme} className="transition-all duration-300">
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-400 transition-transform duration-300 animate-scale-in" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-transform duration-300 animate-scale-in" />
      )}
    </Button>
  );
};

export default ThemeToggle;
