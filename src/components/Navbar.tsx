import React from 'react';
import { Building2, KeyRound, Phone, Home, Layers, Info, CheckCircle } from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: 'home' | 'admin') => void;
  currentView: 'home' | 'admin';
  totalProperties: number;
}

export default function Navbar({ onNavigate, currentView, totalProperties }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md text-stone-800 shadow-sm border-b border-gold-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo Brand */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center space-x-3 cursor-pointer group"
            id="nav-brand-logo"
          >
            <div className="bg-brand-gold p-2.5 rounded-lg text-white shadow-md shadow-brand-gold/20 group-hover:bg-brand-gold-dark transition-all duration-300">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xl font-extrabold tracking-wider font-sans text-stone-900">SUZUKI</span>
                <span className="text-xl font-light font-sans text-brand-gold">IMÓVEIS</span>
              </div>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-mono block">Credibilidade & Tradição</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" id="nav-desktop-menu">
            <button 
              onClick={() => onNavigate('home')}
              className={`flex items-center space-x-1.5 text-sm font-semibold transition-colors py-2 ${
                currentView === 'home' 
                  ? 'text-brand-gold border-b-2 border-brand-gold' 
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Imóveis</span>
            </button>
            <a 
              href="#sobre" 
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-1.5 text-sm font-semibold text-stone-600 hover:text-stone-950 transition-colors"
            >
              <Info className="h-4 w-4" />
              <span>Sobre</span>
            </a>
            <a 
              href="#contato" 
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-1.5 text-sm font-semibold text-stone-600 hover:text-stone-950 transition-colors"
            >
              <Phone className="h-4 w-4" />
              <span>Contato</span>
            </a>
            <span className="h-4 w-px bg-stone-200"></span>
            
            <div className="flex items-center space-x-4">
               {/* Admin Button */}
              <button
                onClick={() => onNavigate(currentView === 'admin' ? 'home' : 'admin')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-brand-gold text-white hover:bg-brand-gold-dark shadow-md shadow-brand-gold/25'
                    : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200 hover:text-stone-950'
                }`}
                id="btn-admin-panel-toggle"
              >
                <KeyRound className="h-4 w-4" />
                <span>{currentView === 'admin' ? 'Ver Site Público' : 'Área do Corretor'}</span>
              </button>

              {/* Dynamic Badge */}
              <div className="bg-gold-50/75 border border-gold-100 px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs font-semibold text-gold-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{totalProperties} Imóveis ativos</span>
              </div>
            </div>
          </nav>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-3">
            <button
              onClick={() => onNavigate(currentView === 'admin' ? 'home' : 'admin')}
              className="p-2 bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950 rounded-lg transition-colors cursor-pointer"
              title="Área do Corretor"
              id="btn-mobile-admin-toggle"
            >
              <KeyRound className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
