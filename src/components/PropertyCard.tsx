import React, { useState } from 'react';
import { Property } from '../types';
import { Bed, Bath, Car, Maximize, MessageSquare, MapPin, Eye, ArrowLeft, ArrowRight, Share2, Heart } from 'lucide-react';

interface PropertyCardProps {
  key?: string;
  property: Property;
  onViewDetails: (property: Property) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export default function PropertyCard({ property, onViewDetails, onToggleFavorite, isFavorite = false }: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Venho do site Suzuki Imóveis e gostaria de saber mais sobre o imóvel código *${property.code}* - ${property.title}`;
    const url = `https://api.whatsapp.com/send?phone=5511970199648&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md border border-stone-100 hover:border-stone-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group h-full"
      id={`property-card-${property.id}`}
    >
      {/* Property Image Slider */}
      <div className="relative h-56 w-full overflow-hidden bg-stone-100">
        <img 
          src={property.images[currentImageIndex] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'} 
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Carousel Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none"></div>

        {/* Dynamic Status Badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-1 z-10">
          <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full text-white shadow-sm ${
            property.type === 'venda' ? 'bg-brand-gold' : 'bg-stone-800'
          }`}>
            {property.type === 'venda' ? 'Venda' : 'Aluguel'}
          </span>
          {property.badge && property.badge !== 'Nenhum' && (
            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-full bg-stone-900/80 text-white border border-stone-700/80 backdrop-blur-sm shadow-sm">
              {property.badge}
            </span>
          )}
        </div>

        {/* Secondary Badges: Code & Featured */}
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
          <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-white/90 text-stone-800 rounded shadow-sm border border-stone-200">
            Cód: {property.code}
          </span>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(property.id);
              }}
              className="p-1.5 bg-white/90 rounded-full hover:bg-white text-stone-700 hover:text-red-500 transition-colors shadow-sm cursor-pointer"
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          )}
        </div>


        {/* Image Controls (Arrows) */}
        {property.images && property.images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image Progress Indicator (Dots) */}
        {property.images && property.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
            {property.images.map((_, idx) => (
              <span 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              ></span>
            ))}
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Neighborhood & City */}
        <div className="flex items-center text-slate-500 text-xs font-medium mb-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1 flex-shrink-0" />
          <span className="truncate">{property.neighborhood}, {property.city} - {property.state}</span>
        </div>

        {/* Title */}
        <h3 
          onClick={() => onViewDetails(property)}
          className="text-slate-900 font-bold text-base hover:text-brand-gold cursor-pointer line-clamp-1 mb-2 transition-colors duration-200 font-sans"
        >
          {property.title}
        </h3>

        {/* Short Description */}
        <p className="text-slate-500 text-xs line-clamp-2 mb-4 flex-1">
          {property.description}
        </p>

        {/* Physical Specs icons */}
        <div className="grid grid-cols-4 gap-2 py-3 border-y border-stone-100 mb-4 text-stone-600 font-medium text-xs">
          <div className="flex flex-col items-center justify-center p-1.5 bg-stone-50 rounded-lg" title="Quartos / Dormitórios">
            <Bed className="h-4 w-4 text-stone-500 mb-0.5" />
            <span className="text-stone-800 text-[11px] font-mono">{property.bedrooms} Quarto{property.bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 bg-stone-50 rounded-lg" title="Banheiros">
            <Bath className="h-4 w-4 text-stone-500 mb-0.5" />
            <span className="text-stone-800 text-[11px] font-mono">{property.bathrooms} Banheiro{property.bathrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 bg-stone-50 rounded-lg" title="Vagas de Garagem">
            <Car className="h-4 w-4 text-stone-500 mb-0.5" />
            <span className="text-stone-800 text-[11px] font-mono">{property.garages} Vaga{property.garages !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-1.5 bg-stone-50 rounded-lg" title="Área Útil">
            <Maximize className="h-4 w-4 text-stone-500 mb-0.5" />
            <span className="text-stone-800 text-[11px] font-mono">{property.area} m²</span>
          </div>
        </div>

        {/* Price & Actions */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-stone-400 text-[10px] font-semibold uppercase block font-mono">Valor total</span>
            <div className="flex items-baseline">
              <span className="text-xl font-black text-stone-900">{formatPrice(property.price)}</span>
              {property.type === 'aluguel' && (
                <span className="text-stone-500 text-xs ml-0.5 font-medium">/mês</span>
              )}
            </div>
          </div>

          <div className="flex space-x-1.5">
            <button
              onClick={handleWhatsAppShare}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
              title="Conversar no WhatsApp"
            >
              <MessageSquare className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewDetails(property)}
              className="px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors flex items-center space-x-1 cursor-pointer shadow-sm hover:shadow"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Ver</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
