export interface Property {
  id: string;
  code: string; // Ex: SZ001
  title: string;
  description: string;
  type: 'venda' | 'aluguel';
  propertyType: 'casa' | 'apartamento' | 'terreno' | 'comercial';
  price: number;
  condo?: number;
  iptu?: number;
  bedrooms: number;
  bathrooms: number;
  suites: number;
  garages: number;
  area: number; // m²
  city: string;
  neighborhood: string;
  state: string;
  address: string;
  images: string[];
  featured: boolean;
  badge: 'Pronto' | 'Em Construção' | 'Lançamento' | 'Nenhum';
  createdAt: string;
}

export interface FilterState {
  search: string;
  type: 'todos' | 'venda' | 'aluguel';
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  suites: string;
  garages: string;
  minArea: string;
  maxArea: string;
  city: string;
  neighborhood: string;
}

export interface MortgageSimulation {
  propertyPrice: number;
  downPayment: number;
  interestRate: number; // % ao ano
  termYears: number; // anos
}

export interface Booking {
  id: string;
  propertyId: string;
  propertyCode: string;
  propertyTitle: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  visitType: 'presencial' | 'virtual';
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  schedulingType?: 'agenda' | 'calendario'; // 'agenda' | 'calendario'
  createdAt: string;
}

