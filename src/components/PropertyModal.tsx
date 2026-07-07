import React, { useState, useEffect, useMemo } from 'react';
import { Property, MortgageSimulation, Booking } from '../types';
import { X, Calendar, DollarSign, Calculator, MapPin, Bed, Bath, Car, Maximize, MessageSquare, Shield, Check, Info, Printer, CheckCircle, Video, User, Phone, Mail } from 'lucide-react';

interface PropertyModalProps {
  property: Property | null;
  onClose: () => void;
  onAddBooking?: (booking: Booking) => void;
}

export default function PropertyModal({ property, onClose, onAddBooking }: PropertyModalProps) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  
  // Quinto Andar Scheduler States
  const [visitType, setVisitType] = useState<'presencial' | 'virtual'>('presencial');
  const [schedulingType, setSchedulingType] = useState<'agenda' | 'calendario'>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<Booking | null>(null);

  // Simulation State
  const [simulation, setSimulation] = useState<MortgageSimulation>({
    propertyPrice: 0,
    downPayment: 0,
    interestRate: 9.5, // % a.a.
    termYears: 30
  });

  const [simulationResult, setSimulationResult] = useState({
    financedAmount: 0,
    firstPayment: 0,
    lastPayment: 0,
    totalPaid: 0
  });

  // Dynamic next 6 days generator for Quinto Andar calendar style
  const nextDays = useMemo(() => {
    const days = [];
    const locale = 'pt-BR';
    const weekdayOptions: Intl.DateTimeFormatOptions = { weekday: 'short' };
    const dayOptions: Intl.DateTimeFormatOptions = { day: 'numeric' };
    const monthOptions: Intl.DateTimeFormatOptions = { month: 'short' };

    for (let i = 1; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const weekday = d.toLocaleDateString(locale, weekdayOptions).replace('.', '');
      const day = d.toLocaleDateString(locale, dayOptions);
      const month = d.toLocaleDateString(locale, monthOptions).replace('.', '');
      const rawDate = d.toISOString().slice(0, 10);
      days.push({
        weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        day,
        month,
        rawDate
      });
    }
    return days;
  }, []);

  // Standard time slots for visit schedule
  const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  useEffect(() => {
    if (property) {
      const defaultDownPayment = Math.round(property.price * 0.2); // 20% down
      setSimulation({
        propertyPrice: property.price,
        downPayment: defaultDownPayment,
        interestRate: 9.5,
        termYears: 30
      });
      setIsBooked(false);
      setBookingDetails(null);
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setCurrentImageIdx(0);
      // Default to first date
      if (nextDays.length > 0) {
        setSelectedDate(nextDays[0].rawDate);
      }
      setSelectedTime('10:00');
    }
  }, [property, nextDays]);

  // Recalculate simulation whenever state changes
  useEffect(() => {
    if (!property) return;

    const price = property.price;
    const downPayment = Math.max(0, Math.min(price, simulation.downPayment));
    const financed = price - downPayment;
    
    if (financed <= 0) {
      setSimulationResult({ financedAmount: 0, firstPayment: 0, lastPayment: 0, totalPaid: 0 });
      return;
    }

    const monthlyRate = (simulation.interestRate / 100) / 12;
    const months = simulation.termYears * 12;

    // SAC Table (Sistema de Amortização Constante)
    const amortization = financed / months;
    const firstMonthInterest = financed * monthlyRate;
    const firstPaymentSAC = amortization + firstMonthInterest;
    
    const lastMonthOutstanding = amortization;
    const lastMonthInterest = lastMonthOutstanding * monthlyRate;
    const lastPaymentSAC = amortization + lastMonthInterest;

    const totalPaidSAC = ((firstPaymentSAC + lastPaymentSAC) / 2) * months + downPayment;

    setSimulationResult({
      financedAmount: financed,
      firstPayment: firstPaymentSAC,
      lastPayment: lastPaymentSAC,
      totalPaid: totalPaidSAC
    });
  }, [simulation, property]);

  if (!property) return null;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedDate || !selectedTime) return;

    const bookingDateObject = nextDays.find(d => d.rawDate === selectedDate);
    const dateFormatted = bookingDateObject 
      ? `${bookingDateObject.weekday}, ${bookingDateObject.day} de ${bookingDateObject.month}` 
      : selectedDate;

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      propertyId: property.id,
      propertyCode: property.code,
      propertyTitle: property.title,
      date: selectedDate,
      timeSlot: selectedTime,
      visitType,
      clientName,
      clientPhone,
      clientEmail,
      status: 'pendente',
      schedulingType,
      createdAt: new Date().toISOString()
    };

    // Save locally or call parent prop
    if (onAddBooking) {
      onAddBooking(newBooking);
    } else {
      const savedBookings = localStorage.getItem('suzuki_bookings');
      const list = savedBookings ? JSON.parse(savedBookings) : [];
      list.push(newBooking);
      localStorage.setItem('suzuki_bookings', JSON.stringify(list));
    }

    setBookingDetails(newBooking);
    setIsBooked(true);

    // Dynamic Email Trigger (mailto to configured address)
    try {
      const emailDest = localStorage.getItem('suzuki_notification_email') || 'contato@aticacriacoes.com';
      const typeStr = visitType === 'presencial' ? 'Presencial' : 'Por Vídeo (Virtual)';
      const schedTypeStr = schedulingType === 'agenda' ? 'Agenda' : 'Calendário';
      const mailtoSubject = `Novo Agendamento Suzuki Imóveis - Código ${property.code} (${schedTypeStr})`;
      const mailtoBody = `Olá,
Novo agendamento de visita realizado pelo site Suzuki Imóveis!

Código do Imóvel: ${property.code}
Título do Imóvel: ${property.title}

Tipo de Visita: ${typeStr}
Destino do Agendamento: ${schedTypeStr}
Data: ${dateFormatted}
Horário: ${selectedTime}

Cliente: ${clientName}
Telefone/WhatsApp: ${clientPhone}
E-mail: ${clientEmail}

Por favor, entre em contato com o cliente para confirmar a visita.`;
      
      const mailtoUrl = `mailto:${emailDest}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;
      window.location.href = mailtoUrl;
    } catch (err) {
      console.error("Falha ao abrir email de notificação:", err);
    }

    // Dynamic WhatsApp trigger with the requested text and number
    setTimeout(() => {
      const typeStr = visitType === 'presencial' ? 'Presencial' : 'Por Vídeo (Virtual)';
      const whatsappText = `Venho do site Suzuki Imóveis e gostaria de saber mais sobre o imóvel código *${property.code}*. Agendei uma visita ${typeStr} para o dia *${dateFormatted}* às *${selectedTime}*! Meu nome é ${clientName}.`;
      window.open(`https://api.whatsapp.com/send?phone=5511970199648&text=${encodeURIComponent(whatsappText)}`, '_blank');
    }, 1500);
  };

  const handleQuickWhatsAppContact = () => {
    const text = `Venho do site Suzuki Imóveis e gostaria de saber mais sobre o imóvel código *${property.code}* - ${property.title}`;
    window.open(`https://api.whatsapp.com/send?phone=5511970199648&text=${encodeURIComponent(text)}`, '_blank');
  };

  const selectedDateObject = nextDays.find(d => d.rawDate === selectedDate);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in" id="property-detail-modal">
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl relative text-stone-800">
        
        {/* Sticky Header Actions */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div>
            <span className="text-brand-gold text-xs font-mono font-bold tracking-widest uppercase">FICHA COMPLETA DO IMÓVEL</span>
            <h2 className="text-lg font-black tracking-tight text-stone-900 truncate max-w-md md:max-w-xl">{property.title}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => window.print()}
              className="p-2 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-lg transition-colors cursor-pointer hidden sm:block"
              title="Imprimir Ficha"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-brand-gold rounded-lg transition-all duration-300 cursor-pointer"
              id="btn-close-modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Media & Specs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* High-Res Image Gallery Carousel */}
            <div className="relative h-64 sm:h-96 rounded-xl overflow-hidden border border-stone-200 bg-stone-50">
              <img 
                src={property.images[currentImageIdx] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'} 
                alt={`${property.title} - Foto ${currentImageIdx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Image Badges */}
              <div className="absolute top-4 left-4 flex space-x-2">
                <span className="px-3 py-1 bg-brand-gold text-white rounded text-xs font-bold tracking-wider uppercase">
                  {property.type === 'venda' ? 'Venda' : 'Aluguel'}
                </span>
                <span className="px-3 py-1 bg-white/90 border border-stone-200 text-stone-800 rounded text-xs font-mono font-bold tracking-wider">
                  Cód: {property.code}
                </span>
              </div>

              {/* Slider Thumbnails Row inside Slider overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex space-x-2 overflow-x-auto p-1.5 bg-black/30 backdrop-blur-sm rounded-lg z-10 scrollbar-none">
                {property.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIdx(idx)}
                    className={`h-10 w-14 sm:h-12 sm:w-16 rounded overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                      idx === currentImageIdx ? 'border-brand-gold scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Specs Icons Strip */}
            <div className="grid grid-cols-4 gap-2 p-3 bg-stone-50 border border-stone-200/60 rounded-xl text-center text-stone-700">
              <div className="flex flex-col items-center justify-center p-1">
                <Bed className="h-5 w-5 text-brand-gold mb-1" />
                <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Dormitórios</span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 font-mono mt-0.5">{property.bedrooms} Quarto{property.bedrooms !== 1 ? 's' : ''}</span>
                {property.suites > 0 && (
                  <span className="text-[9px] text-brand-gold-dark font-semibold">({property.suites} suíte{property.suites !== 1 ? 's' : ''})</span>
                )}
              </div>
              <div className="flex flex-col items-center justify-center p-1">
                <Bath className="h-5 w-5 text-brand-gold mb-1" />
                <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Banheiros</span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 font-mono mt-0.5">{property.bathrooms} Banheiro{property.bathrooms !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1">
                <Car className="h-5 w-5 text-brand-gold mb-1" />
                <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Vagas</span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 font-mono mt-0.5">{property.garages} Vaga{property.garages !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-1">
                <Maximize className="h-5 w-5 text-brand-gold mb-1" />
                <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">Área Privativa</span>
                <span className="text-xs sm:text-sm font-bold text-stone-900 font-mono mt-0.5">{property.area} m²</span>
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-3">
              <h3 className="text-base font-bold border-b border-stone-100 pb-2 text-stone-900 font-sans">Descrição do Imóvel</h3>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {property.description}
              </p>
            </div>

            {/* Features Checklist List */}
            <div className="space-y-3">
              <h3 className="text-base font-bold border-b border-stone-100 pb-2 text-stone-900 font-sans">Características Gerais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Área Gourmet integrada',
                  'Acabamentos em mármore',
                  'Mobiliário sob medida',
                  'Iluminação em LED planejada',
                  'Aquecimento central',
                  'Infraestrutura para ar-condicionado',
                  'Piscina privativa aquecida',
                  'Segurança monitorada 24h',
                  'Vizinhança tranquila residencial'
                ].map((feat, i) => (
                  <div key={i} className="flex items-center space-x-2 text-sm text-stone-600">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-sans">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Address Detail Box */}
            <div className="space-y-3 p-4 bg-stone-50 border border-stone-200/60 rounded-xl">
              <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-1.5 uppercase font-mono">
                <MapPin className="h-4 w-4 text-brand-gold" />
                <span>Localização exata</span>
              </h3>
              <div className="text-stone-600 text-sm font-sans">
                <p className="font-bold text-stone-900">{property.address}</p>
                <p>{property.neighborhood} - {property.city} / {property.state}</p>
              </div>
              <div className="h-40 rounded-lg overflow-hidden relative border border-stone-200 bg-stone-100 mt-3 flex items-center justify-center">
                <div className="absolute inset-0 bg-stone-950/5"></div>
                <div className="text-center p-4 relative z-10 max-w-sm">
                  <MapPin className="h-8 w-8 text-brand-gold mx-auto mb-2 animate-bounce" />
                  <span className="text-xs text-stone-500 block font-sans">
                    Mapa interativo indisponível em ambiente de demonstração. O imóvel fica próximo a referências, metrô e comércio local de alto padrão.
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Mortgage Simulator (White & Gold Theme) */}
            {property.type === 'venda' && (
              <div className="p-6 bg-stone-50 border border-stone-200/80 rounded-xl space-y-5">
                <div className="flex items-center space-x-2 border-b border-stone-100 pb-3">
                  <Calculator className="h-5 w-5 text-brand-gold" />
                  <h3 className="text-base font-bold text-stone-900 font-sans">Simulador de Financiamento (Tabela SAC)</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Down Payment */}
                  <div>
                    <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Entrada (R$)</label>
                    <input
                      type="number"
                      value={simulation.downPayment}
                      onChange={(e) => setSimulation({ ...simulation, downPayment: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                    />
                    <span className="text-[10px] text-stone-400">Mínimo sugerido de 20%</span>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Taxa de Juros (% a.a.)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={simulation.interestRate}
                      onChange={(e) => setSimulation({ ...simulation, interestRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                    />
                    <span className="text-[10px] text-stone-400">Ex: 9.5% taxa CEF</span>
                  </div>

                  {/* Term Years */}
                  <div>
                    <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Prazo (Anos)</label>
                    <select
                      value={simulation.termYears}
                      onChange={(e) => setSimulation({ ...simulation, termYears: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                    >
                      <option value={10}>10 Anos (120 meses)</option>
                      <option value={15}>15 Anos (180 meses)</option>
                      <option value={20}>20 Anos (240 meses)</option>
                      <option value={30}>30 Anos (360 meses)</option>
                      <option value={35}>35 Anos (420 meses)</option>
                    </select>
                    <span className="text-[10px] text-stone-400">Parcelas decrescentes</span>
                  </div>
                </div>

                {/* Simulation Result Output */}
                <div className="p-4 bg-white border border-stone-200 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                  <div className="sm:border-r border-stone-100 p-1">
                    <span className="text-[10px] text-stone-400 uppercase font-mono">Valor Financiado</span>
                    <p className="text-base font-bold text-stone-900 mt-1">{formatPrice(simulationResult.financedAmount)}</p>
                  </div>
                  <div className="sm:border-r border-stone-100 p-1">
                    <span className="text-[10px] text-stone-400 uppercase font-mono">1ª Parcela (Maior)</span>
                    <p className="text-base font-bold text-stone-900 mt-1">{formatPrice(simulationResult.firstPayment)}</p>
                  </div>
                  <div className="sm:border-r border-stone-100 p-1">
                    <span className="text-[10px] text-stone-400 uppercase font-mono">Última Parcela (Menor)</span>
                    <p className="text-base font-bold text-brand-gold mt-1">{formatPrice(simulationResult.lastPayment)}</p>
                  </div>
                  <div className="p-1">
                    <span className="text-[10px] text-stone-400 uppercase font-mono">Total Estimado</span>
                    <p className="text-base font-bold text-stone-900 mt-1">{formatPrice(simulationResult.totalPaid)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 text-xs text-stone-500 leading-normal font-sans">
                  <Info className="h-4 w-4 text-brand-gold flex-shrink-0 mt-0.5" />
                  <span>
                    Simulação meramente informativa para fins de aprovação prévia. A tabela SAC amortiza parcelas reduzindo os juros mensais aplicados sobre o saldo devedor.
                  </span>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Sticky Pricing & Quinto Andar Style Interactive Visit Scheduler */}
          <div className="space-y-6">
            
            {/* Pricing Card */}
            <div className="p-6 bg-stone-50 border border-stone-200/80 rounded-xl space-y-4">
              <div>
                <span className="text-xs text-stone-400 uppercase tracking-wider font-mono">Valor solicitado</span>
                <p className="text-3xl font-black text-stone-950 font-sans">{formatPrice(property.price)}</p>
                {property.type === 'aluguel' && <span className="text-xs text-stone-500 font-sans block mt-0.5">/mês de aluguel</span>}
              </div>

              {/* Maintenance Charges Grid */}
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-stone-200/80 text-xs text-stone-600 font-mono">
                <div>
                  <span className="text-stone-400 block uppercase font-mono">Condomínio</span>
                  <span className="font-bold text-stone-900">{property.condo ? formatPrice(property.condo) : 'R$ 0,00'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block uppercase font-mono">IPTU Anual</span>
                  <span className="font-bold text-stone-900">{property.iptu ? formatPrice(property.iptu) : 'R$ 0,00'}</span>
                </div>
              </div>

              {/* WhatsApp Quick Direct Button */}
              <button
                onClick={handleQuickWhatsAppContact}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm tracking-wider uppercase transition-colors duration-200 cursor-pointer shadow-lg shadow-emerald-600/10"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Conversar no WhatsApp</span>
              </button>
            </div>

            {/* Quinto Andar Style Booking Panel */}
            <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-sm space-y-4 relative" id="quinto-andar-scheduler">
              <div className="border-b border-stone-100 pb-3">
                <span className="px-2 py-0.5 bg-gold-50 text-gold-800 rounded font-bold text-[9px] font-mono tracking-widest uppercase inline-block mb-1">AGENDAMENTO ONLINE</span>
                <h3 className="text-base font-extrabold text-stone-900 font-sans">Agende sua Visita Grátis</h3>
                <p className="text-xs text-stone-500 font-sans">Escolha o dia, horário e reserve em menos de 1 minuto</p>
              </div>

              {isBooked ? (
                <div className="py-6 text-center space-y-3 animate-fade-in">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-full inline-block">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <h4 className="text-stone-900 font-black text-base font-sans">Visita Pré-Agendada!</h4>
                  <p className="text-stone-600 text-xs font-sans">
                    Agendamento gravado para <strong>{bookingDetails?.visitType === 'presencial' ? 'Visita Presencial' : 'Visita Virtual'}</strong> em:
                  </p>
                  <div className="p-3 bg-stone-50 border border-stone-100 rounded-lg text-stone-800 text-xs font-mono font-bold">
                    {selectedDateObject ? `${selectedDateObject.weekday}, ${selectedDateObject.day} de ${selectedDateObject.month}` : selectedDate} às {selectedTime}
                  </div>
                  <p className="text-[11px] text-stone-500 font-sans">
                    Nossa equipe Suzuki Imóveis enviará uma mensagem confirmando em instantes no celular fornecido.
                  </p>
                  <button
                    onClick={() => setIsBooked(false)}
                    className="mt-2 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark cursor-pointer underline font-sans"
                  >
                    Agendar outro horário
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Step 1: Visit Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 font-mono">1. Tipo de Visita</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVisitType('presencial')}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          visitType === 'presencial'
                            ? 'bg-brand-gold border-brand-gold text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Presencial</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisitType('virtual')}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          visitType === 'virtual'
                            ? 'bg-brand-gold border-brand-gold text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Vídeo-Chamada</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 1.5: Schedule Destination (Agenda vs Calendário) */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 font-mono">Destino do Agendamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSchedulingType('agenda')}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          schedulingType === 'agenda'
                            ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        <span>Agenda</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSchedulingType('calendario')}
                        className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          schedulingType === 'calendario'
                            ? 'bg-stone-900 border-stone-900 text-white shadow-sm'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        <span>Calendário</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Date Selector Carousel (Horizontal Slider) */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 font-mono">2. Selecione o Dia</label>
                    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
                      {nextDays.map((day) => (
                        <button
                          key={day.rawDate}
                          type="button"
                          onClick={() => setSelectedDate(day.rawDate)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center min-w-[70px] flex-shrink-0 transition-all cursor-pointer ${
                            selectedDate === day.rawDate
                              ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                          }`}
                        >
                          <span className="text-[9px] uppercase tracking-wider font-semibold font-mono">{day.weekday}</span>
                          <span className="text-base font-extrabold font-sans mt-0.5">{day.day}</span>
                          <span className="text-[9px] uppercase tracking-wider font-mono">{day.month}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Time Slot Grid Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 font-mono">3. Selecione o Horário</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`py-1.5 text-center rounded border text-xs font-bold font-mono transition-all cursor-pointer ${
                            selectedTime === time
                              ? 'bg-brand-gold border-brand-gold text-white shadow-sm'
                              : 'bg-stone-50 border-stone-100 text-stone-600 hover:bg-stone-100 border-stone-200'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Personal Info Fields */}
                  <div className="space-y-2 border-t border-stone-100 pt-3">
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 font-mono">4. Suas Informações</label>
                    
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        required
                        placeholder="Nome completo"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-xs text-stone-800 outline-none font-sans"
                      />
                    </div>

                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="tel"
                        required
                        placeholder="WhatsApp (DDD)"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-xs text-stone-800 outline-none font-sans"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="email"
                        required
                        placeholder="Seu e-mail"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-xs text-stone-800 outline-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Step 5: Submission Button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-lg font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-brand-gold/15 cursor-pointer"
                  >
                    Confirmar Agendamento
                  </button>
                </form>
              )}

              <div className="text-center pt-1 border-t border-stone-100 mt-2">
                <span className="text-[9px] text-stone-400 flex items-center justify-center space-x-1 font-sans">
                  <Shield className="h-3 w-3 text-stone-400" />
                  <span>Sem compromisso. Cancelamento grátis e imediato.</span>
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
