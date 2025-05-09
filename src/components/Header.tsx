
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DarkModeToggle from '@/components/DarkModeToggle';

const Header: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <header className="app-header py-3 px-4 shadow-md">
      <div className="container max-w-6xl mx-auto flex justify-between items-center">
        {isHomePage ? (
          <div className="flex items-center gap-2">
            <Menu className="h-5 w-5 text-white" />
            <h1 className="text-lg font-bold text-white">FitDaily</h1>
          </div>
        ) : (
          <Link to="/" className="flex items-center gap-2 text-white">
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </Link>
        )}
        
        <div className="flex items-center gap-2">
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
