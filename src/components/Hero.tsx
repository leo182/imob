import React from 'react';
import { Search, MapPin, Home, DollarSign, ArrowRight, RotateCcw, Bed, ShieldCheck, Tag } from 'lucide-react';
import { FilterState } from '../types';

interface HeroProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  availableCities: string[];
  availableNeighborhoods: string[];
}

export default function Hero({
  filters,
  onFilterChange,
  onResetFilters,
  availableCities,
  availableNeighborhoods
}: HeroProps) {
  
  const handleChange = (field: keyof FilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const setType = (type: 'todos' | 'venda' | 'aluguel') => {
    onFilterChange({
      ...filters,
      type
    });
  };

  return (
    <div className="relative bg-stone-50 pb-8 overflow-hidden" id="hero-section">
      {/* Background Image Banner with dark glassmorphism overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80" 
          alt="Suzuki Imóveis Background" 
          className="w-full h-full object-cover opacity-10 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-50/70 via-stone-50/90 to-stone-100"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center">
        {/* Value Proposition */}
        <div className="inline-flex items-center space-x-2 bg-gold-50 border border-gold-200/50 px-4 py-1.5 rounded-full mb-6">
          <ShieldCheck className="h-4 w-4 text-brand-gold animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-gold-800 uppercase font-mono">Encontre seu lar com quem entende de tradição</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-900 mb-6 font-sans">
          Seu próximo destino começa <span className="text-brand-gold">aqui</span>
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 mb-10 leading-relaxed font-sans">
          Casas de alto padrão, apartamentos modernos, coberturas e áreas comerciais selecionadas nas melhores localizações. Encontre o imóvel ideal para morar ou investir com a Suzuki Imóveis.
        </p>

        {/* Filter Container */}
        <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-md border border-stone-200/60 rounded-2xl shadow-xl p-6 sm:p-8" id="filter-panel">
          {/* Venda / Aluguel / Todos Toggle Buttons */}
          <div className="flex justify-center sm:justify-start space-x-2 mb-6">
            <button
              onClick={() => setType('todos')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                filters.type === 'todos'
                  ? 'bg-brand-gold text-white shadow-md shadow-brand-gold/20'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todos os Imóveis
            </button>
            <button
              onClick={() => setType('venda')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                filters.type === 'venda'
                  ? 'bg-brand-gold text-white shadow-md shadow-brand-gold/20'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Comprar
            </button>
            <button
              onClick={() => setType('aluguel')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                filters.type === 'aluguel'
                  ? 'bg-brand-gold text-white shadow-md shadow-brand-gold/20'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Alugar
            </button>
          </div>

          {/* Core Search Forms (Grid Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Search Input */}
            <div className="col-span-1 md:col-span-2 relative">
              <label className="block text-left text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Pesquisa geral</label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Busque por código, título, descrição..."
                  value={filters.search}
                  onChange={(e) => handleChange('search', e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-xl text-stone-800 placeholder-stone-400 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Property Type Dropdown */}
            <div>
              <label className="block text-left text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Tipo de Imóvel</label>
              <div className="relative">
                <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <select
                  value={filters.propertyType}
                  onChange={(e) => handleChange('propertyType', e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-xl text-stone-800 appearance-none outline-none transition-colors"
                >
                  <option value="todos">Todos os tipos</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                </select>
              </div>
            </div>

            {/* City Dropdown */}
            <div>
              <label className="block text-left text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Cidade</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <select
                  value={filters.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-xl text-stone-800 appearance-none outline-none transition-colors"
                >
                  <option value="todas">Todas as cidades</option>
                  {availableCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          {/* Advanced Filtering Options Collapsible/Always Open Segment */}
          <div className="mt-5 pt-5 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
            
            {/* Price Filter Group */}
            <div className="col-span-1 sm:col-span-2">
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Faixa de Preço (R$)</span>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">Mín</span>
                  <input
                    type="number"
                    placeholder="Ex: 100.000"
                    value={filters.minPrice}
                    onChange={(e) => handleChange('minPrice', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors"
                  />
                </div>
                <span className="text-stone-400 text-xs">até</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">Máx</span>
                  <input
                    type="number"
                    placeholder="Ex: 2.000.000"
                    value={filters.maxPrice}
                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Rooms Filter */}
            <div>
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Quartos</span>
              <div className="flex space-x-1 bg-stone-50 p-1 rounded-lg border border-stone-200">
                {['todos', '1', '2', '3', '4+'].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleChange('bedrooms', num)}
                    className={`flex-1 py-1 text-center rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      filters.bedrooms === num
                        ? 'bg-brand-gold text-white shadow'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50'
                    }`}
                  >
                    {num === 'todos' ? 'T' : num}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Filter Group */}
            <div>
              <span className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 font-mono">Área Mínima (m²)</span>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Ex: 80"
                  value={filters.minArea}
                  onChange={(e) => handleChange('minArea', e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 placeholder-stone-400 outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-mono">m²</span>
              </div>
            </div>

          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-stone-100 text-sm">
            <span className="text-stone-400 text-xs text-left font-sans">
              * Utilize os filtros acima para encontrar propriedades compatíveis.
            </span>
            <div className="flex space-x-3">
              <button
                onClick={onResetFilters}
                className="flex items-center space-x-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
                id="btn-reset-filters"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Limpar Filtros</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
