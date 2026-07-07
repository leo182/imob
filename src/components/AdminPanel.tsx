import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Property, Booking } from '../types';
import { PRESET_IMAGE_OPTIONS } from '../data';
import { 
  Plus, Edit, Trash2, Key, Download, Upload, ShieldCheck, 
  Star, CheckCircle, HardDrive, Eye, Calendar, User, Video, 
  Phone, MessageSquare, Check, X, Building2, LayoutDashboard, Clock,
  Database, Cloud, Wifi, RefreshCw, Copy, Mail
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  dbFetchBookings, 
  dbSaveBooking, 
  dbDeleteBooking, 
  dbSyncLocalToCloud, 
  testSupabaseConnection, 
  SUPABASE_SQL_SETUP,
  encryptCredentials
} from '../lib/supabase';

interface AdminPanelProps {
  properties: Property[];
  onAddProperty: (property: Property) => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (id: string) => void;
  onImportBackup: (imported: Property[]) => void;
  onClose: () => void;
}

export default function AdminPanel({
  properties,
  onAddProperty,
  onEditProperty,
  onDeleteProperty,
  onImportBackup,
  onClose
}: AdminPanelProps) {
  // Simple Password Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('suzuki_admin_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active Admin Tab: 'properties' | 'bookings' | 'database'
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings' | 'database'>('properties');

  // Bookings list state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Supabase Database Settings States
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [dbEnabled, setDbEnabled] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState<{ propertiesSynced: number; bookingsSynced: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [generatedToken, setGeneratedToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  const handleGenerateObfuscatedToken = () => {
    if (!dbUrl || !dbKey) {
      showNotification('Preencha os campos URL e API Key do Supabase primeiro!');
      return;
    }
    const token = encryptCredentials(dbUrl.trim(), dbKey.trim());
    setGeneratedToken(token);
    showNotification('Código seguro gerado com sucesso!');
  };

  const handleCopyToken = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(`window.SUZUKI_SECURED_CONFIG = "${generatedToken}";`);
    setCopiedToken(true);
    showNotification('Código de configuração copiado para a área de transferência!');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Load database configuration
  useEffect(() => {
    const config = getSupabaseConfig();
    setDbUrl(config.url);
    setDbKey(config.key);
    setDbEnabled(config.enabled);
  }, []);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  
  // Property Fields State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'venda' | 'aluguel'>('venda');
  const [propertyType, setPropertyType] = useState<'casa' | 'apartamento' | 'terreno' | 'comercial'>('casa');
  const [price, setPrice] = useState('');
  const [condo, setCondo] = useState('');
  const [iptu, setIptu] = useState('');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [suites, setSuites] = useState('1');
  const [garages, setGarages] = useState('1');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('SP');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [badge, setBadge] = useState<'Pronto' | 'Em Construção' | 'Lançamento' | 'Nenhum'>('Pronto');

  const [notification, setNotification] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notification Email and Cities States
  const [notificationEmail, setNotificationEmail] = useState(() => {
    return localStorage.getItem('suzuki_notification_email') || 'contato@aticacriacoes.com';
  });

  const [cities, setCities] = useState<string[]>(() => {
    const saved = localStorage.getItem('suzuki_cities');
    return saved ? JSON.parse(saved) : ['São Paulo', 'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul'];
  });
  const [newCityName, setNewCityName] = useState('');
  const [showAddCityInput, setShowAddCityInput] = useState(false);

  useEffect(() => {
    localStorage.setItem('suzuki_cities', JSON.stringify(cities));
  }, [cities]);

  const handleSaveNotificationEmail = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('suzuki_notification_email', notificationEmail);
    showNotification('E-mail de notificação salvo com sucesso!');
  };

  // Load Bookings from localStorage or Supabase
  const loadBookings = async () => {
    setIsLoadingBookings(true);
    const config = getSupabaseConfig();
    if (config.enabled && config.url && config.key) {
      try {
        const cloudBookings = await dbFetchBookings();
        if (cloudBookings) {
          setBookings(cloudBookings);
          setIsLoadingBookings(false);
          return;
        }
      } catch (err) {
        console.error('Falha ao ler agendamentos do Supabase. Usando local.', err);
      }
    }

    // Fallback to local
    const savedBookings = localStorage.getItem('suzuki_bookings');
    if (savedBookings) {
      try {
        setBookings(JSON.parse(savedBookings));
      } catch (e) {
        setBookings([]);
      }
    } else {
      setBookings([]);
    }
    setIsLoadingBookings(false);
  };

  useEffect(() => {
    loadBookings();
    // Listen for localStorage changes (if any)
    window.addEventListener('storage', loadBookings);
    return () => {
      window.removeEventListener('storage', loadBookings);
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123' || password === 'suzuki2026') {
      setIsAuthenticated(true);
      localStorage.setItem('suzuki_admin_auth', 'true');
      setLoginError('');
      loadBookings();
    } else {
      setLoginError('Senha de acesso incorreta! Tente "admin123"');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('suzuki_admin_auth');
  };

  const openAddForm = () => {
    setEditingPropertyId(null);
    const nextCodeNum = properties.length > 0 
      ? Math.max(...properties.map(p => {
          const num = parseInt(p.code.replace(/[^0-9]/g, ''), 10);
          return isNaN(num) ? 100 : num;
        })) + 1 
      : 101;
    setCode(`SZ${nextCodeNum}`);
    setTitle('');
    setDescription('');
    setType('venda');
    setPropertyType('casa');
    setPrice('');
    setCondo('');
    setIptu('');
    setBedrooms('3');
    setBathrooms('2');
    setSuites('1');
    setGarages('2');
    setArea('');
    setCity('São Paulo');
    setNeighborhood('');
    setState('SP');
    setAddress('');
    setImages([PRESET_IMAGE_OPTIONS[0].url]);
    setFeatured(false);
    setBadge('Pronto');
    setIsFormOpen(true);
  };

  const openEditForm = (property: Property) => {
    setEditingPropertyId(property.id);
    setCode(property.code);
    setTitle(property.title);
    setDescription(property.description);
    setType(property.type);
    setPropertyType(property.propertyType);
    setPrice(property.price.toString());
    setCondo(property.condo ? property.condo.toString() : '');
    setIptu(property.iptu ? property.iptu.toString() : '');
    setBedrooms(property.bedrooms.toString());
    setBathrooms(property.bathrooms.toString());
    setSuites(property.suites.toString());
    setGarages(property.garages.toString());
    setArea(property.area.toString());
    setCity(property.city);
    setNeighborhood(property.neighborhood);
    setState(property.state);
    setAddress(property.address);
    setImages(property.images || []);
    setFeatured(property.featured);
    setBadge(property.badge);
    setIsFormOpen(true);
  };

  const handleSaveProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !area || !code || images.length === 0) {
      alert('Por favor, preencha todos os campos obrigatórios e adicione ao menos uma imagem!');
      return;
    }

    const payload: Property = {
      id: editingPropertyId || `sz-${Date.now()}`,
      code,
      title,
      description,
      type,
      propertyType,
      price: Number(price),
      condo: condo ? Number(condo) : 0,
      iptu: iptu ? Number(iptu) : 0,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      suites: Number(suites),
      garages: Number(garages),
      area: Number(area),
      city,
      neighborhood,
      state,
      address,
      images,
      featured,
      badge,
      createdAt: editingPropertyId 
        ? (properties.find(p => p.id === editingPropertyId)?.createdAt || new Date().toISOString())
        : new Date().toISOString()
    };

    if (editingPropertyId) {
      onEditProperty(payload);
      showNotification('Imóvel atualizado com sucesso!');
    } else {
      onAddProperty(payload);
      showNotification('Novo imóvel adicionado com sucesso!');
    }
    setIsFormOpen(false);
  };

  const handleDelete = (id: string, propCode: string) => {
    if (window.confirm(`Tem certeza que deseja remover permanentemente o imóvel código ${propCode}?`)) {
      onDeleteProperty(id);
      showNotification(`Imóvel ${propCode} excluído com sucesso.`);
    }
  };

  const addImageFromUrl = () => {
    if (currentImageUrl) {
      setImages([...images, currentImageUrl]);
      setCurrentImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  // backup export JSON
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(properties, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `suzuki_imoveis_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Backup exportado com sucesso!');
  };

  // backup import JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportBackup(parsed);
            showNotification(`Backup restaurado! ${parsed.length} imóveis importados.`);
          } else {
            alert('Formato de backup inválido! O arquivo precisa conter um array de imóveis.');
          }
        } catch (err) {
          alert('Erro ao analisar arquivo de backup.');
        }
      };
    }
  };

  // Booking action handlers
  const handleUpdateBookingStatus = async (id: string, status: 'confirmado' | 'cancelado') => {
    const updated = bookings.map(bk => bk.id === id ? { ...bk, status } : bk);
    setBookings(updated);
    localStorage.setItem('suzuki_bookings', JSON.stringify(updated));

    const config = getSupabaseConfig();
    if (config.enabled) {
      try {
        const bookingToUpdate = updated.find(bk => bk.id === id);
        if (bookingToUpdate) {
          await dbSaveBooking(bookingToUpdate);
        }
        showNotification(`Agendamento ${status === 'confirmado' ? 'confirmado' : 'cancelado'} atualizado no Supabase!`);
      } catch (e) {
        console.error("Erro ao atualizar status no Supabase", e);
        showNotification(`Agendamento atualizado localmente, mas falhou ao sincronizar no Supabase.`);
      }
    } else {
      showNotification(`Agendamento ${status === 'confirmado' ? 'confirmado' : 'cancelado'} com sucesso!`);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Deseja remover este registro de agendamento permanentemente?')) {
      const updated = bookings.filter(bk => bk.id !== id);
      setBookings(updated);
      localStorage.setItem('suzuki_bookings', JSON.stringify(updated));

      const config = getSupabaseConfig();
      if (config.enabled) {
        try {
          await dbDeleteBooking(id);
          showNotification('Registro de agendamento excluído do Supabase.');
        } catch (e) {
          console.error(e);
          showNotification('Excluído localmente, mas falhou ao excluir no Supabase.');
        }
      } else {
        showNotification('Registro de agendamento excluído.');
      }
    }
  };

  // Supabase management actions
  const handleSaveDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(dbUrl, dbKey, dbEnabled);
    showNotification('Configurações do banco de dados salvas!');
    
    if (dbEnabled) {
      loadBookings();
      alert('Conexão configurada e ativada! Recarregue a página (F5) para atualizar a vitrine de imóveis com o banco Supabase.');
    }
  };

  const handleTestConnection = async () => {
    if (!dbUrl || !dbKey) {
      alert('Por favor, preencha a URL e a Chave Anon antes de testar!');
      return;
    }
    setTestStatus('testing');
    const isOk = await testSupabaseConnection(dbUrl, dbKey);
    if (isOk) {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    } else {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 4000);
    }
  };

  const handleSyncDataToCloud = async () => {
    if (!dbEnabled || !dbUrl || !dbKey) {
      alert('Ative e salve a configuração do Supabase antes de sincronizar os dados!');
      return;
    }
    
    if (window.confirm('Deseja enviar todo o seu portfólio de imóveis e registros de agendamento do navegador atual para o seu Supabase na nuvem? Isso irá criar/mesclar com os dados lá.')) {
      setSyncStatus('syncing');
      try {
        const result = await dbSyncLocalToCloud(properties, bookings);
        setSyncResult(result);
        setSyncStatus('success');
        showNotification('Dados sincronizados com sucesso para o Supabase Cloud!');
        loadBookings();
      } catch (err: any) {
        console.error(err);
        setSyncStatus('error');
        alert(`Erro ao sincronizar: ${err.message || err}. Certifique-se de que executou o script SQL de tabelas no seu banco Supabase!`);
      }
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleContactClientWhatsApp = (bk: Booking) => {
    const statusText = bk.status === 'confirmado' ? 'CONFIRMADA' : 'pré-agendada';
    const msg = `Olá ${bk.clientName}, sou o corretor da Suzuki Imóveis! Entro em contato para falar sobre a sua visita ${bk.visitType === 'presencial' ? 'presencial' : 'virtual'} ao imóvel código *${bk.propertyCode}* agendada para o dia *${bk.date}* às *${bk.timeSlot}*. A visita está ${statusText}.`;
    window.open(`https://api.whatsapp.com/send?phone=55${bk.clientPhone.replace(/\D/g, '')}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalProps = properties.length;
    const totalBks = bookings.length;
    const pendingBks = bookings.filter(b => b.status === 'pendente').length;
    const confirmedBks = bookings.filter(b => b.status === 'confirmado').length;
    return { totalProps, totalBks, pendingBks, confirmedBks };
  }, [properties, bookings]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-stone-50 text-stone-800 py-12">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gold-50 border border-gold-200/50 text-brand-gold mb-4">
              <Key className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-stone-900 font-sans">Área do Corretor Suzuki</h2>
            <p className="mt-2 text-xs text-stone-500 font-sans">
              Autenticação obrigatória para acessar o gerenciamento de imóveis e a central de agendamento de visitas.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-stone-500 uppercase tracking-wider mb-1.5">Senha Administrativa</label>
              <input
                type="password"
                required
                placeholder="Dica: digite admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-xl text-stone-800 outline-none transition-all placeholder-stone-400 font-mono text-center"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-600 font-semibold text-center">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-md shadow-brand-gold/20 cursor-pointer font-sans"
            >
              Autenticar Painel
            </button>
          </form>

          <div className="text-center border-t border-stone-100 pt-4">
            <button
              onClick={onClose}
              className="text-xs font-bold text-stone-500 hover:text-brand-gold transition-colors cursor-pointer font-sans"
            >
              ← Voltar para o Site Público
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen text-stone-800 pb-20 font-sans">
      
      {/* Sub-Header */}
      <div className="bg-white border-b border-stone-200/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-brand-gold font-mono font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span>Painel do Corretor Autenticado</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight font-sans">Suzuki Imóveis Administração</h1>
          </div>

          {/* Quick Actions / Backup Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openAddForm}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-lg text-sm font-bold tracking-wide uppercase transition-all shadow-md shadow-brand-gold/15 cursor-pointer font-sans"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Imóvel</span>
            </button>
            
            {/* Backup Export */}
            <button
              onClick={handleExportBackup}
              title="Salvar Backup JSON"
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 text-stone-500" />
              <span>Exportar Backup</span>
            </button>

            {/* Backup Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Restaurar de arquivo JSON"
              className="flex items-center space-x-1.5 px-3 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4 text-stone-500" />
              <span>Importar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={handleLogout}
              className="px-3 py-2.5 bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-600 rounded-lg text-xs font-bold transition-colors cursor-pointer uppercase tracking-wider"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Dynamic Notification Popup */}
        {notification && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3 shadow-sm animate-fade-in">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold">{notification}</span>
          </div>
        )}

        {/* Dashboard Stats Overview Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold block">Imóveis Cadastrados</span>
              <p className="text-2xl font-black text-stone-900 mt-1">{stats.totalProps}</p>
            </div>
            <div className="p-2.5 bg-stone-50 rounded-lg text-stone-500 border border-stone-100">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 font-bold block">Total de Agendamentos</span>
              <p className="text-2xl font-black text-stone-900 mt-1">{stats.totalBks}</p>
            </div>
            <div className="p-2.5 bg-stone-50 rounded-lg text-stone-500 border border-stone-100">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-amber-600 font-bold block">Visitas Pendentes</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.pendingBks}</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 font-bold block">Visitas Confirmadas</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.confirmedBks}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-stone-200 mb-6 bg-white p-1 rounded-xl border gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveTab('properties')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'properties'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Lista de Imóveis</span>
          </button>
          
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer relative ${
              activeTab === 'bookings'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Agendamentos QuintoAndar</span>
            {stats.pendingBks > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                {stats.pendingBks}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'database'
                ? 'bg-stone-900 text-white'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>Banco de Dados Cloud (Supabase)</span>
          </button>
        </div>

        {/* Modal-like dialog form for Adding/Editing */}
        {isFormOpen && (
          <div className="mb-10 bg-white border border-stone-200 rounded-2xl shadow-xl p-6 sm:p-8 animate-slide-up relative">
            <div className="absolute top-6 right-6">
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 hover:text-stone-900 transition-colors cursor-pointer font-bold text-xs"
              >
                Cancelar
              </button>
            </div>

            <h2 className="text-xl font-bold text-stone-900 tracking-tight mb-6 flex items-center space-x-2 font-sans">
              <div className="h-2 w-2 rounded-full bg-brand-gold"></div>
              <span>{editingPropertyId ? `Editando Imóvel Cód: ${code}` : 'Cadastrar Novo Imóvel'}</span>
            </h2>

            <form onSubmit={handleSaveProperty} className="space-y-6">
              
              {/* Form Section 1: Basic Identifiers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Código Suzuki *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SZ101"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                  />
                </div>
                
                <div className="md:col-span-3">
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Título do Anúncio *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apartamento Vista Mar Decorado"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                  />
                </div>
              </div>

              {/* Form Section 2: Type, Category, Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Tipo de Negócio *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'venda' | 'aluguel')}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                  >
                    <option value="venda">Venda</option>
                    <option value="aluguel">Aluguel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Tipo do Imóvel *</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                  >
                    <option value="casa">Casa</option>
                    <option value="apartamento">Apartamento</option>
                    <option value="terreno">Terreno</option>
                    <option value="comercial">Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Preço Total (R$) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 850000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Fase da Obra (Selo)</label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans"
                  >
                    <option value="Pronto">Pronto</option>
                    <option value="Em Construção">Em Construção</option>
                    <option value="Lançamento">Lançamento</option>
                    <option value="Nenhum">Sem Selo Especial</option>
                  </select>
                </div>
              </div>

              {/* Form Section 3: Physical Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Quartos</label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Banheiros</label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Suítes</label>
                  <input
                    type="number"
                    value={suites}
                    onChange={(e) => setSuites(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Garagens</label>
                  <input
                    type="number"
                    value={garages}
                    onChange={(e) => setGarages(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Área Útil (m²) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 110"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Destaque</label>
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="h-4 w-4 text-brand-gold border-stone-300 rounded focus:ring-brand-gold"
                    />
                    <label htmlFor="featured" className="ml-2 text-xs text-stone-600 font-bold cursor-pointer uppercase">Marcar Destaque</label>
                  </div>
                </div>
              </div>

              {/* Form Section 4: Maintenance Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Condomínio Mensal (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 580"
                    value={condo}
                    onChange={(e) => setCondo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">IPTU Anual (R$)</label>
                  <input
                    type="number"
                    placeholder="Ex: 1200"
                    value={iptu}
                    onChange={(e) => setIptu(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Form Section 5: Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Estado *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none font-sans font-bold"
                  >
                    {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(sigla => (
                      <option key={sigla} value={sigla}>{sigla}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Cidade *</label>
                  <div className="space-y-1.5">
                    <select
                      value={cities.includes(city) ? city : '__add__'}
                      onChange={(e) => {
                        if (e.target.value === '__add__') {
                          setShowAddCityInput(true);
                        } else {
                          setCity(e.target.value);
                          setShowAddCityInput(false);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none"
                    >
                      {cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="__add__" className="text-brand-gold font-bold">+ Criar Nova Cidade...</option>
                    </select>

                    {showAddCityInput && (
                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Nome da cidade"
                          value={newCityName}
                          onChange={(e) => setNewCityName(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-stone-200 focus:border-brand-gold rounded text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCityName.trim()) {
                              const cleaned = newCityName.trim();
                              if (!cities.includes(cleaned)) {
                                setCities([...cities, cleaned]);
                              }
                              setCity(cleaned);
                              setNewCityName('');
                              setShowAddCityInput(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-bold uppercase cursor-pointer"
                        >
                          Adicionar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Bairro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pinheiros"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Endereço Completo (Rua, Número, Apto) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Av. Brigadeiro Faria Lima, 2300 - Apto 82"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none"
                  />
                </div>
              </div>

              {/* Form Section 6: Image URLs */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-4">
                <span className="block text-xs font-bold text-stone-900 uppercase font-mono tracking-wider">Imagens e Fotos do Imóvel ({images.length}) *</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 flex gap-2">
                    <input
                      type="text"
                      placeholder="Cole a URL da foto aqui"
                      value={currentImageUrl}
                      onChange={(e) => setCurrentImageUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-white border border-stone-200 focus:border-brand-gold rounded-lg text-xs text-stone-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={addImageFromUrl}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold uppercase transition-colors whitespace-nowrap"
                    >
                      Adicionar URL
                    </button>
                  </div>
                  
                  <div className="sm:col-span-4 flex items-center justify-end">
                    <label className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shadow-sm">
                      <Upload className="h-4 w-4" />
                      <span>Fazer Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach((file: any) => {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setImages(prev => [...prev, event.target!.result as string]);
                                }
                              };
                              reader.readAsDataURL(file as Blob);
                            });
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative h-20 rounded border border-stone-200 overflow-hidden bg-white">
                      <img src={url} alt="Galeria" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer"
                        title="Remover Imagem"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Section 7: Description */}
              <div>
                <label className="block text-xs font-mono text-stone-500 mb-1.5 uppercase">Descrição Detalhada do Anúncio *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escreva detalhes como acabamento, proximidade ao metrô, armários sob medida, insolação, etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-sm text-stone-800 outline-none"
                />
              </div>

              {/* Form Controls */}
              <div className="flex justify-between items-center border-t border-stone-100 pt-5">
                <span className="text-xs text-stone-400 font-sans">* Campos marcados com asterisco são obrigatórios.</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-white rounded-lg text-xs font-bold tracking-wider uppercase transition-colors shadow-md shadow-brand-gold/15 cursor-pointer"
                  >
                    {editingPropertyId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Tab 1: Properties Management */}
        {activeTab === 'properties' && (
          <div className="space-y-6">
            {/* CPanel Hosting Instructions Section (Extremely requested value-added guide) */}
            <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-2 uppercase font-mono mb-3">
                <HardDrive className="h-4.5 w-4.5 text-brand-gold animate-pulse" />
                <span>Guia de Implantação no CPanel (Hospedagem Static SPA)</span>
              </h3>
              <div className="text-xs text-stone-600 space-y-2 font-sans leading-relaxed">
                <p>
                  Este site de imobiliária foi desenvolvido como um <strong>Static Single-Page Application (SPA)</strong>. 
                  Isso garante que ele rode perfeitamente em 100% dos servidores CPanel de forma otimizada, rápida e sem necessidade de configurar Node.js no servidor!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/50">
                    <span className="font-bold text-stone-900 block mb-1">1. Gerar os Arquivos</span>
                    No menu de exportação ou através da IDE de build, compile o site. O resultado será a pasta <code>dist/</code> com todos os arquivos estáticos compilados prontos.
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/50">
                    <span className="font-bold text-stone-900 block mb-1">2. Enviar via CPanel</span>
                    Acesse o Gerenciador de Arquivos do CPanel, entre na pasta <code>public_html</code> e envie os arquivos contidos dentro da pasta <code>dist/</code> para lá.
                  </div>
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-200/50">
                    <span className="font-bold text-stone-900 block mb-1">3. Banco de Dados</span>
                    O site salva novos imóveis diretamente no cache persistente (localStorage). Lembre-se de clicar em <strong>"Exportar Backup"</strong> para baixar o JSON com seus imóveis e garantir a cópia de segurança!
                  </div>
                </div>
              </div>
            </div>

            {/* Existing Properties Administrative Management Grid */}
            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900">Todos os Imóveis Cadastrados ({properties.length})</h3>
                <span className="text-xs text-stone-400 font-sans hidden sm:inline">Clique nas ações para editar os campos ou remover o anúncio</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-stone-50 text-stone-500 text-xs font-mono uppercase border-b border-stone-200">
                    <tr>
                      <th className="px-6 py-3.5">Código</th>
                      <th className="px-6 py-3.5">Título / Tipo</th>
                      <th className="px-6 py-3.5">Bairro / Cidade</th>
                      <th className="px-6 py-3.5">Preço</th>
                      <th className="px-6 py-3.5 font-mono">Características</th>
                      <th className="px-6 py-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {properties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-stone-50/50 transition-colors">
                        {/* Code & Highlight badge */}
                        <td className="px-6 py-4 whitespace-nowrap font-mono">
                          <div className="flex items-center space-x-2">
                            {prop.featured && (
                              <span className="p-1 bg-amber-50 rounded text-amber-600" title="Imóvel em Destaque">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              </span>
                            )}
                            <span className="font-bold text-stone-900">{prop.code}</span>
                          </div>
                        </td>

                        {/* Title and Badge */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-stone-800 max-w-xs truncate">{prop.title}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${
                              prop.type === 'venda' ? 'bg-brand-gold' : 'bg-stone-700'
                            }`}>
                              {prop.type === 'venda' ? 'Venda' : 'Aluguel'}
                            </span>
                            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded uppercase font-mono">
                              {prop.propertyType}
                            </span>
                          </div>
                        </td>

                        {/* Neighborhood & City */}
                        <td className="px-6 py-4 whitespace-nowrap text-stone-600">
                          <div>{prop.neighborhood}</div>
                          <div className="text-xs text-stone-400">{prop.city} - {prop.state}</div>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-stone-900 font-mono">
                          {formatBRL(prop.price)}
                          {prop.type === 'aluguel' && <span className="text-stone-400 font-normal text-xs font-sans">/mês</span>}
                        </td>

                        {/* Specs string */}
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-stone-500 font-mono">
                          {prop.bedrooms}Q | {prop.bathrooms}B | {prop.garages}V | {prop.area}m²
                        </td>

                        {/* Action buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => openEditForm(prop)}
                              className="p-1.5 bg-stone-100 hover:bg-brand-gold hover:text-white text-stone-600 rounded transition-colors cursor-pointer"
                              title="Editar Registro"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(prop.id, prop.code)}
                              className="p-1.5 bg-stone-100 hover:bg-red-600 hover:text-white text-stone-600 rounded transition-colors cursor-pointer"
                              title="Excluir Registro"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {properties.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-stone-400 font-sans">
                          Nenhum imóvel cadastrado no banco de dados. Adicione um para iniciar!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-sans">Lista de Agendamentos (QuintoAndar UX)</h3>
                <p className="text-xs text-stone-400 font-sans mt-0.5">Visitas solicitadas por clientes no site Suzuki Imóveis</p>
              </div>
              <div className="text-xs text-stone-500">
                Você pode interagir direto com o cliente via WhatsApp!
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-stone-50 text-stone-500 text-xs font-mono uppercase border-b border-stone-200">
                  <tr>
                    <th className="px-6 py-3.5">Cliente</th>
                    <th className="px-6 py-3.5">Data / Hora</th>
                    <th className="px-6 py-3.5">Imóvel Solicitado</th>
                    <th className="px-6 py-3.5">Modalidade</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bookings.map((bk) => (
                    <tr key={bk.id} className="hover:bg-stone-50/30 transition-colors">
                      {/* Client Info */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-stone-900">{bk.clientName}</div>
                        <div className="text-xs text-stone-500 flex flex-col space-y-0.5 mt-0.5 font-mono">
                          <span className="flex items-center"><Phone className="h-3 w-3 mr-1" /> {bk.clientPhone}</span>
                          <span className="lowercase">{bk.clientEmail}</span>
                        </div>
                      </td>

                      {/* Date / Time */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-stone-800 font-mono">{bk.date}</div>
                        <div className="text-xs text-stone-500 font-bold font-mono">às {bk.timeSlot}</div>
                      </td>

                      {/* Property Ref */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-brand-gold font-mono uppercase">Cód: {bk.propertyCode}</div>
                        <div className="text-xs text-stone-700 truncate max-w-xs">{bk.propertyTitle}</div>
                      </td>

                      {/* Modalidade */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {bk.visitType === 'presencial' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 border border-blue-100 text-blue-700 font-bold uppercase font-mono">
                            <User className="h-3 w-3 mr-1" />
                            <span>Presencial</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-purple-50 border border-purple-100 text-purple-700 font-bold uppercase font-mono">
                            <Video className="h-3 w-3 mr-1" />
                            <span>Por Vídeo</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {bk.status === 'pendente' && (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-50 border border-amber-200 text-amber-700">
                            Pendente
                          </span>
                        )}
                        {bk.status === 'confirmado' && (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                            Confirmado
                          </span>
                        )}
                        {bk.status === 'cancelado' && (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-stone-100 border border-stone-200 text-stone-500">
                            Cancelado
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center space-x-1.5">
                          {bk.status === 'pendente' && (
                            <>
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, 'confirmado')}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 rounded transition-colors cursor-pointer"
                                title="Confirmar Horário"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateBookingStatus(bk.id, 'cancelado')}
                                className="p-1.5 bg-stone-100 hover:bg-stone-500 text-stone-500 hover:text-white border border-stone-200 rounded transition-colors cursor-pointer"
                                title="Cancelar Horário"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleContactClientWhatsApp(bk)}
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-500 text-emerald-700 hover:text-white rounded transition-colors cursor-pointer"
                            title="Conversar com o Cliente via WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteBooking(bk.id)}
                            className="p-1.5 bg-stone-50 hover:bg-red-600 hover:text-white text-stone-400 rounded transition-colors cursor-pointer"
                            title="Excluir Registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-stone-400 font-sans">
                        Nenhum agendamento de visita registrado ainda. Faça uma simulação no modal de detalhes do imóvel para ver como funciona!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Database / Supabase Cloud Settings */}
        {activeTab === 'database' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            <div className="lg:col-span-5 space-y-6">
              {/* E-mail de Notificação Config Card */}
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 border-b border-stone-200 pb-4">
                  <div className="bg-amber-50 text-brand-gold p-2.5 rounded-xl border border-amber-100">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-stone-900">E-mail de Notificação</h3>
                    <p className="text-xs text-stone-500 font-sans">Destinatário das notificações de agendamento</p>
                  </div>
                </div>

                <form onSubmit={handleSaveNotificationEmail} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-1.5">E-mail do Corretor *</label>
                    <input
                      type="email"
                      required
                      placeholder="contato@aticacriacoes.com"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 focus:border-brand-gold rounded-lg text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Salvar E-mail
                  </button>
                </form>
              </div>

              {/* Supabase Connection Config Card */}
              <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex items-center space-x-3 border-b border-stone-150 pb-4">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100">
                  <Cloud className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-stone-900">Configuração Supabase</h3>
                  <p className="text-xs text-stone-500">Mantenha seus dados na nuvem com segurança</p>
                </div>
              </div>

              <form onSubmit={handleSaveDbConfig} className="space-y-5">
                {/* Active Toggle Switch */}
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-bold text-stone-800">Ativar Banco Supabase</span>
                    <span className="text-xs text-stone-500">Mudar do armazenamento local para a nuvem</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={dbEnabled}
                      onChange={(e) => setDbEnabled(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-1.5">Project URL *</label>
                    <input
                      type="url"
                      placeholder="https://your-project.supabase.co"
                      value={dbUrl}
                      onChange={(e) => setDbUrl(e.target.value)}
                      disabled={!dbEnabled}
                      className="w-full px-3.5 py-2.5 bg-stone-50 disabled:bg-stone-100 disabled:opacity-65 border border-stone-200 focus:border-emerald-500 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-500 uppercase tracking-wider mb-1.5">API Anon Key *</label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={dbKey}
                      onChange={(e) => setDbKey(e.target.value)}
                      disabled={!dbEnabled}
                      className="w-full px-3.5 py-2.5 bg-stone-50 disabled:bg-stone-100 disabled:opacity-65 border border-stone-200 focus:border-emerald-500 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={!dbEnabled || testStatus === 'testing'}
                    className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    {testStatus === 'testing' ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Testando...</span>
                      </>
                    ) : testStatus === 'success' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Conectado!</span>
                      </>
                    ) : testStatus === 'error' ? (
                      <span className="text-red-600">Erro de Conexão</span>
                    ) : (
                      <>
                        <Wifi className="h-3.5 w-3.5 text-stone-500" />
                        <span>Testar Conexão</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Salvar Configuração
                  </button>
                </div>
              </form>

              {/* Data Migration Box */}
              <div className="border-t border-stone-200 pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Migração de Dados (Local → Nuvem)</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Migre as listagens de imóveis e agendamentos existentes neste navegador para o Supabase Cloud instantaneamente.
                  </p>
                </div>

                <button
                  onClick={handleSyncDataToCloud}
                  disabled={!dbEnabled || syncStatus === 'syncing'}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-100 disabled:text-stone-400 disabled:opacity-60 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>Sincronizar Dados Locais para Nuvem</span>
                </button>

                {syncStatus === 'success' && syncResult && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                    <p className="font-bold">✓ Sincronização Concluída!</p>
                    <p className="mt-1 font-mono text-[10px]">
                      Propriedades: {syncResult.propertiesSynced} enviadas<br />
                      Agendamentos: {syncResult.bookingsSynced} enviados
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* instructions & SQL Script Copy Card */}
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-5">
              <div>
                <h3 className="text-lg font-black text-stone-900">Como criar seu banco Supabase Gratuito</h3>
                <p className="text-xs text-stone-500 mt-1">Siga este passo a passo simples de 2 minutos para configurar seu servidor SQL:</p>
              </div>

              <div className="space-y-3.5 text-xs text-stone-600 leading-relaxed font-sans font-medium">
                <p>
                  1. Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline hover:text-emerald-700">Supabase.com</a> e crie uma conta gratuita.
                </p>
                <p>
                  2. Crie um novo projeto chamado <code>Suzuki Imoveis</code>. Defina sua senha de banco de dados.
                </p>
                <p>
                  3. No menu lateral do painel do Supabase, clique em <strong>"SQL Editor"</strong> e em seguida em <strong>"New query"</strong>.
                </p>
                <p>
                  4. Cole o script SQL abaixo e clique no botão verde <strong>"Run"</strong> para criar as tabelas e as políticas de segurança.
                </p>
                <p>
                  5. Vá em <strong>Project Settings</strong> → <strong>API</strong> para copiar a sua <strong>Project URL</strong> e <strong>Anon Key</strong> e colá-las no formulário ao lado. Pronto!
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 font-mono tracking-wide uppercase">Script SQL de Inicialização</span>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md text-xs font-bold transition-all cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar Código SQL</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900 max-h-72 overflow-y-auto">
                  <pre className="p-4 text-stone-300 font-mono text-[10px] sm:text-xs leading-relaxed whitespace-pre-wrap select-all">
                    {SUPABASE_SQL_SETUP}
                  </pre>
                </div>
              </div>

              {/* Credentials Obfuscation Section */}
              <div className="border-t border-stone-150 pt-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 flex items-center space-x-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Ofuscador de Chaves Seguro (Distribuição em HTML)</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 font-sans">
                    Gere um token de configuração oculto de alta segurança para colocar diretamente no código do arquivo HTML distribuído aos Corretores de Imóveis, sem expor as senhas cruas à inspeção simples do navegador.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGenerateObfuscatedToken}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <span>Gerar Código Ofuscado do Supabase</span>
                  </button>

                  {generatedToken && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                      <span className="block text-[10px] font-mono font-bold text-stone-500 uppercase">Copie e cole a linha abaixo antes da tag de script no seu HTML:</span>
                      <div className="flex gap-2 items-center">
                        <code className="flex-1 p-2 bg-stone-900 text-stone-100 text-[10px] rounded font-mono truncate select-all">
                          {`window.SUZUKI_SECURED_CONFIG = "${generatedToken}";`}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyToken}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase transition-colors shrink-0"
                        >
                          {copiedToken ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
