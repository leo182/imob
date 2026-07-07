import React, { useState, useEffect, useMemo } from 'react';
import { Property, FilterState, Booking } from './types';
import { INITIAL_PROPERTIES, CITIES_LIST } from './data';
import { getSupabaseConfig, dbFetchProperties, dbSaveProperty, dbDeleteProperty, dbSaveBooking } from './lib/supabase';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PropertyCard from './components/PropertyCard';
import PropertyModal from './components/PropertyModal';
import AdminPanel from './components/AdminPanel';
import { Building2, MessageSquare, Phone, Mail, MapPin, Grid, List, Clock, SlidersHorizontal, ArrowUpDown, ChevronDown, CheckCircle, Award, Compass, Star } from 'lucide-react';

export default function App() {
  // View states
  const [currentView, setCurrentView] = useState<'home' | 'admin'>('home');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // Properties Database loaded from localStorage or default static listings
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('suzuki_properties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error('Erro ao ler do localStorage. Usando padrões.', err);
      }
    }
    return INITIAL_PROPERTIES;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('suzuki_properties', JSON.stringify(properties));
  }, [properties]);

  // Load properties from Supabase on start if enabled
  useEffect(() => {
    const fetchCloudProperties = async () => {
      const config = getSupabaseConfig();
      if (config.enabled && config.url && config.key) {
        setIsLoadingCloud(true);
        try {
          const cloudData = await dbFetchProperties();
          if (cloudData) {
            setProperties(cloudData);
          }
        } catch (err) {
          console.error('Falha ao sincronizar com o Supabase. Usando cópia local.', err);
        } finally {
          setIsLoadingCloud(false);
        }
      }
    };
    fetchCloudProperties();
  }, []);

  // Favorites / Bookmarks
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('suzuki_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('suzuki_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  // Filter State
  const initialFilterState: FilterState = {
    search: '',
    type: 'todos',
    propertyType: 'todos',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'todos',
    suites: 'todos',
    garages: 'todos',
    minArea: '',
    maxArea: '',
    city: 'todas',
    neighborhood: ''
  };

  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  
  // Sorting selection
  const [sortBy, setSortBy] = useState<string>('recentes');

  // Reset Filters trigger
  const handleResetFilters = () => {
    setFilters(initialFilterState);
  };

  // CRUD handlers for AdminPanel
  const handleAddProperty = async (newProp: Property) => {
    setProperties(prev => [newProp, ...prev]);
    const config = getSupabaseConfig();
    if (config.enabled) {
      try {
        await dbSaveProperty(newProp);
      } catch (err) {
        console.error('Erro ao salvar no Supabase:', err);
      }
    }
  };

  const handleEditProperty = async (updatedProp: Property) => {
    setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p));
    const config = getSupabaseConfig();
    if (config.enabled) {
      try {
        await dbSaveProperty(updatedProp);
      } catch (err) {
        console.error('Erro ao atualizar no Supabase:', err);
      }
    }
  };

  const handleDeleteProperty = async (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
    const config = getSupabaseConfig();
    if (config.enabled) {
      try {
        await dbDeleteProperty(id);
      } catch (err) {
        console.error('Erro ao excluir do Supabase:', err);
      }
    }
  };

  const handleImportBackup = async (imported: Property[]) => {
    setProperties(imported);
    const config = getSupabaseConfig();
    if (config.enabled) {
      try {
        // Sync all to Supabase
        for (const prop of imported) {
          await dbSaveProperty(prop);
        }
      } catch (err) {
        console.error('Erro ao sincronizar backup importado com o Supabase:', err);
      }
    }
  };

  const handleAddBooking = async (newBooking: Booking) => {
    // Save to local storage as fallback/cache
    const savedBookings = localStorage.getItem('suzuki_bookings');
    const list = savedBookings ? JSON.parse(savedBookings) : [];
    list.push(newBooking);
    localStorage.setItem('suzuki_bookings', JSON.stringify(list));
    
    const config = getSupabaseConfig();
    if (config.enabled) {
      try {
        await dbSaveBooking(newBooking);
      } catch (err) {
        console.error('Falha ao salvar agendamento no Supabase:', err);
      }
    }
  };

  // Get dynamic unique Cities and Neighborhoods from existing properties list to feed options
  const availableCities = useMemo(() => {
    const cities = properties.map(p => p.city);
    return Array.from(new Set(cities)).sort();
  }, [properties]);

  const availableNeighborhoods = useMemo(() => {
    const neighborhoods = properties.map(p => p.neighborhood);
    return Array.from(new Set(neighborhoods)).sort();
  }, [properties]);

  // Filter and Sort properties list
  const filteredAndSortedProperties = useMemo(() => {
    return properties
      .filter((prop) => {
        // Search text matching Title, description, address, neighborhood, city, and Code
        if (filters.search) {
          const query = filters.search.toLowerCase();
          const matchTitle = prop.title.toLowerCase().includes(query);
          const matchDesc = prop.description.toLowerCase().includes(query);
          const matchCode = prop.code.toLowerCase().includes(query);
          const matchAddress = prop.address.toLowerCase().includes(query);
          const matchNeighborhood = prop.neighborhood.toLowerCase().includes(query);
          const matchCity = prop.city.toLowerCase().includes(query);

          if (!matchTitle && !matchDesc && !matchCode && !matchAddress && !matchNeighborhood && !matchCity) {
            return false;
          }
        }

        // Venda vs Aluguel type
        if (filters.type !== 'todos' && prop.type !== filters.type) {
          return false;
        }

        // Property type (Apartamento, Casa, etc)
        if (filters.propertyType !== 'todos' && prop.propertyType !== filters.propertyType) {
          return false;
        }

        // Min Price
        if (filters.minPrice && prop.price < Number(filters.minPrice)) {
          return false;
        }

        // Max Price
        if (filters.maxPrice && prop.price > Number(filters.maxPrice)) {
          return false;
        }

        // Bedrooms count
        if (filters.bedrooms !== 'todos') {
          if (filters.bedrooms === '4+') {
            if (prop.bedrooms < 4) return false;
          } else {
            if (prop.bedrooms !== Number(filters.bedrooms)) return false;
          }
        }

        // Min Area size
        if (filters.minArea && prop.area < Number(filters.minArea)) {
          return false;
        }

        // City
        if (filters.city !== 'todas' && prop.city !== filters.city) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort lists logic
        if (sortBy === 'recentes') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'menor-preco') {
          return a.price - b.price;
        }
        if (sortBy === 'maior-preco') {
          return b.price - a.price;
        }
        if (sortBy === 'maior-area') {
          return b.area - a.area;
        }
        return 0;
      });
  }, [properties, filters, sortBy]);

  // Featured Properties list
  const featuredProperties = useMemo(() => {
    return properties.filter(p => p.featured);
  }, [properties]);

  const handleWhatsAppFloatingClick = () => {
    const text = 'Venho do site Suzuki Imóveis e gostaria de saber mais';
    window.open(`https://api.whatsapp.com/send?phone=5511970199648&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 flex flex-col font-sans selection:bg-brand-gold selection:text-white" id="main-container">
      {/* Dynamic Header Component */}
      <Navbar 
        onNavigate={setCurrentView} 
        currentView={currentView} 
        totalProperties={properties.length}
      />

      {currentView === 'home' ? (
        <main className="flex-1">
          {/* Hero Banner Section with search tools inside */}
          <Hero 
            filters={filters} 
            onFilterChange={setFilters} 
            onResetFilters={handleResetFilters}
            availableCities={availableCities}
            availableNeighborhoods={availableNeighborhoods}
          />

          {/* Destaques (Featured Carousel Section) */}
          {featuredProperties.length > 0 && !filters.search && filters.type === 'todos' && (
            <section className="py-12 bg-stone-100 border-b border-stone-200" id="featured-properties-section">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center space-x-2.5 mb-6">
                  <span className="p-1.5 bg-brand-gold/10 rounded-lg text-brand-gold">
                    <Star className="h-5 w-5 fill-brand-gold" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-stone-900 font-sans">Imóveis Suzuki em Destaque</h2>
                    <p className="text-xs text-stone-500 uppercase tracking-widest font-mono mt-0.5">As melhores oportunidades escolhidas de forma exclusiva</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {featuredProperties.map(property => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      onViewDetails={setSelectedProperty}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favorites.includes(property.id)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Catalog Listings Main Section */}
          <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="catalog-section">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-stone-200 pb-5 mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-stone-900 font-sans">Lançamentos & Oportunidades</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Encontrados <span className="font-bold text-brand-gold">{filteredAndSortedProperties.length}</span> imóveis de acordo com seus critérios.
                </p>
              </div>

              {/* Sorting & Views Controls toolbar */}
              <div className="flex items-center space-x-4 self-end md:self-center">
                <div className="flex items-center space-x-2">
                  <ArrowUpDown className="h-4 w-4 text-stone-400" />
                  <span className="text-xs font-bold text-stone-500 uppercase font-mono">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-stone-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-brand-gold transition-colors"
                  >
                    <option value="recentes">Mais Recentes</option>
                    <option value="menor-preco">Menor Preço</option>
                    <option value="maior-preco">Maior Preço</option>
                    <option value="maior-area">Maior Área (m²)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedProperties.map(property => (
                <PropertyCard 
                  key={property.id} 
                  property={property} 
                  onViewDetails={setSelectedProperty}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={favorites.includes(property.id)}
                />
              ))}

              {filteredAndSortedProperties.length === 0 && (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="text-stone-300 text-4xl font-extrabold uppercase font-mono">Nenhum Imóvel Encontrado</div>
                  <p className="text-stone-500 max-w-md mx-auto text-sm font-sans">
                    Não encontramos propriedades que correspondam aos filtros de busca selecionados. Tente relaxar as restrições ou limpe os filtros para recomeçar.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-brand-gold text-white font-bold text-xs tracking-wider uppercase rounded-lg transition-colors cursor-pointer font-sans"
                  >
                    Limpar Filtros e Resetar Busca
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* About Us (Sobre Nós) Section */}
          <section id="sobre" className="py-16 bg-white text-stone-850 border-t border-stone-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-gold-50 border border-gold-200/50 px-3 py-1 rounded-full">
                  <Award className="h-4 w-4 text-brand-gold animate-bounce" />
                  <span className="text-[10px] font-bold tracking-wider text-gold-800 uppercase font-mono">Tradição & Transparência</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 font-sans">
                  Suzuki Imóveis: Realizando sonhos com credibilidade e sofisticação
                </h2>
                <p className="text-stone-600 text-sm leading-relaxed font-sans">
                  Fundada sob os pilares da seriedade, transparência e respeito, a Suzuki Imóveis consolidou-se como a principal imobiliária boutique do mercado. Nosso compromisso é assessorar de forma integral cada etapa de compra, venda e locação, oferecendo um atendimento inteiramente personalizado e focado no seu perfil e bem-estar.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4 text-center">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-2xl sm:text-3xl font-black text-brand-gold block font-mono">20+</span>
                    <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block mt-1">Anos de Mercado</span>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-2xl sm:text-3xl font-black text-brand-gold block font-mono">1.2k+</span>
                    <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block mt-1">Casas Entregues</span>
                  </div>
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-2xl sm:text-3xl font-black text-brand-gold block font-mono">99%</span>
                    <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block mt-1">Recomendação</span>
                  </div>
                </div>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 h-96">
                <img 
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80" 
                  alt="Suzuki Imóveis Office" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                  <span className="text-xs font-bold text-brand-gold font-mono uppercase block">Sede Corporativa Suzuki</span>
                  <span className="text-sm text-white/95 mt-1 block font-sans">Nosso escritório físico conta com assessoria jurídica e corretores credenciados para seu atendimento de excelência.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Contact (Contato) Form Section */}
          <section id="contato" className="py-16 bg-stone-50 border-t border-stone-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
              <Compass className="h-10 w-10 text-brand-gold mx-auto animate-spin-slow" />
              <h2 className="text-3xl font-black tracking-tight text-stone-900 font-sans">Pronto para dar o próximo passo?</h2>
              <p className="text-stone-600 max-w-xl mx-auto text-sm leading-relaxed font-sans">
                Nossa equipe de corretores credenciados está à inteira disposição para responder qualquer dúvida ou organizar sua visita.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 max-w-xl mx-auto font-sans">
                <a 
                  href={`https://api.whatsapp.com/send?phone=5511970199648&text=${encodeURIComponent('Venho do site Suzuki Imóveis e gostaria de saber mais')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center p-5 bg-white border border-stone-200 rounded-xl hover:border-brand-gold transition-all duration-300 shadow-sm hover:shadow cursor-pointer"
                >
                  <MessageSquare className="h-8 w-8 text-emerald-500 mb-2" />
                  <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider font-bold">WhatsApp Suzuki</span>
                  <span className="text-sm font-extrabold text-stone-800 mt-1 font-mono">(11) 97019-9648</span>
                  <span className="text-[10px] text-stone-400 mt-1">Mensagem rápida instantânea</span>
                </a>
                <a 
                  href="mailto:contato@suzukiimoveis.com"
                  className="flex flex-col items-center p-5 bg-white border border-stone-200 rounded-xl hover:border-brand-gold transition-all duration-300 shadow-sm hover:shadow cursor-pointer"
                >
                  <Mail className="h-8 w-8 text-brand-gold mb-2" />
                  <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider font-bold">Email Comercial</span>
                  <span className="text-sm font-extrabold text-stone-800 mt-1 font-mono truncate max-w-full">contato@suzukiimoveis.com</span>
                  <span className="text-[10px] text-stone-400 mt-1">Retorno em até 2 horas</span>
                </a>
              </div>
            </div>
          </section>

        </main>
      ) : (
        /* Administrative Panel view */
        <AdminPanel
          properties={properties}
          onAddProperty={handleAddProperty}
          onEditProperty={handleEditProperty}
          onDeleteProperty={handleDeleteProperty}
          onImportBackup={handleImportBackup}
          onClose={() => setCurrentView('home')}
        />
      )}

      {/* Property Details Sheet Modal popup overlay */}
      {selectedProperty && (
        <PropertyModal 
          property={selectedProperty} 
          onClose={() => setSelectedProperty(null)} 
          onAddBooking={handleAddBooking}
        />
      )}

      {/* Footer component */}
      <footer className="bg-white text-stone-500 py-12 border-t border-stone-200 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-brand-gold p-2 rounded text-white shadow-md shadow-brand-gold/25">
                <Building2 className="h-5 w-5" />
              </div>
              <span className="text-base font-black tracking-wider text-stone-900">SUZUKI IMÓVEIS</span>
            </div>
            <p className="text-stone-500 leading-relaxed max-w-sm font-sans">
              CRECI J-97019. Venda, locação, assessoria jurídica e avaliação profissional de imóveis selecionados com total dedicação e máxima discrição.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-stone-900 text-sm font-bold uppercase tracking-widest font-mono">Endereço de Atendimento</h4>
            <div className="space-y-2 leading-relaxed">
              <p className="flex items-start">
                <MapPin className="h-4 w-4 text-brand-gold mr-2 flex-shrink-0 mt-0.5" />
                <span className="font-sans">Alameda Lorena, 1420 - Jardins, São Paulo - SP<br />CEP 01424-001</span>
              </p>
              <p className="text-stone-400 font-sans">Atendimento presencial de Segunda a Sexta das 9h às 18h. Sábados mediante agendamento prévio com o corretor.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-stone-900 text-sm font-bold uppercase tracking-widest font-mono">Atendimento Digital</h4>
            <p className="text-stone-400 leading-relaxed font-sans">Fale instantaneamente com nosso plantão de vendas no WhatsApp para tirar dúvidas ou agendar visitas em menos de 1 minuto.</p>
            <button
              onClick={handleWhatsAppFloatingClick}
              className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg uppercase tracking-wide cursor-pointer transition-colors font-sans"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Conversar no WhatsApp</span>
            </button>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-center text-stone-400 gap-4">
          <span className="font-sans">&copy; {new Date().getFullYear()} Suzuki Imóveis Ltda. Todos os direitos reservados.</span>
          <div className="flex space-x-4 font-sans">
            <a href="#" className="hover:text-brand-gold transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-brand-gold transition-colors">Privacidade (LGPD)</a>
          </div>
        </div>
      </footer>

      {/* Floating Sticky WhatsApp Button */}
      <button
        onClick={handleWhatsAppFloatingClick}
        className="fixed bottom-6 right-6 z-45 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 cursor-pointer flex items-center justify-center border-2 border-white/10"
        title="Falar no WhatsApp Suzuki"
        id="btn-whatsapp-floating"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

    </div>
  );
}
