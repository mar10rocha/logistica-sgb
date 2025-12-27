import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Truck, User, ClipboardList, Plus, Search, 
  ArrowRight, ArrowLeft, Check, Trash2, X, PlusCircle, Layers, Info,
  BarChart3, TrendingUp, Calendar, Filter, Award, Download, FileSpreadsheet,
  Home, ChevronRight, Settings, Box, PieChart, Zap, Target, Gauge, AlertTriangle, 
  RefreshCw, Edit3, LogOut, Lock, UserCheck, Key, UserPlus, Users, ShieldCheck, Clock, Camera, Upload,
  Activity, BarChart
} from 'lucide-react';

// --- Configuração Supabase ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

// --- Funções Auxiliares ---

const calculateHL = (unidadesPorPacote, litragem) => {
  const units = parseFloat(unidadesPorPacote) || 0;
  const liters = parseFloat(litragem) || 0;
  return (units * liters) / 100;
};

const processImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 400; 
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        let sourceX = 0;
        let sourceY = 0;
        let sourceSize = Math.min(img.width, img.height);
        sourceX = (img.width - sourceSize) / 2;
        sourceY = (img.height - sourceSize) / 2;
        ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const downloadCSV = (filename, data) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? "" : row[header];
      return `"${val.toString().replace(/"/g, '""')}"`;
    }).join(';'))
  ].join('\n');
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Componentes de UI Básicos ---

function Input({ label, type = 'text', value, onChange, ...props }) {
  return (
    <div className="space-y-1 w-full italic text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">{label}</label>
      <input 
        type={type} 
        value={value ?? ''} 
        onChange={e => onChange(e.target.value)} 
        className="w-full px-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:ring-4 focus:ring-[#006837]/10 focus:border-[#006837] outline-none transition-all font-bold text-slate-800 shadow-inner" 
        {...props} 
      />
    </div>
  );
}

function ImageUpload({ current, onImageSelect }) {
  const [preview, setPreview] = useState(current || '');

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const processed = await processImage(file);
        setPreview(processed);
        onImageSelect(processed);
      } catch (err) {
        console.error("Erro ao processar imagem", err);
      }
    }
  };

  return (
    <div className="space-y-2 text-left">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest italic">Imagem (Auto-Ajuste Quadrado)</label>
      <div className="flex items-center gap-6 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] hover:bg-emerald-50 transition-colors">
        <div className="w-24 h-24 bg-white rounded-3xl overflow-hidden border-4 border-white shadow-lg shrink-0 flex items-center justify-center text-slate-200">
           {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : <Camera size={32} />}
        </div>
        <div className="flex-1">
           <label className="bg-[#006837] text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 cursor-pointer hover:bg-[#004d2a] shadow-sm w-fit">
              <Upload size={14} /> Selecionar Foto
              <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
           </label>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, icon, color, border }) {
  return (
     <div className={`${color} p-8 rounded-[3.5rem] shadow-md ${border} flex flex-col justify-between group transition-all hover:shadow-xl italic`}>
        <div className="p-4 bg-slate-50 rounded-[1.5rem] w-fit text-[#006837] mb-6 group-hover:scale-110 transition-transform shadow-inner">{icon}</div>
        <div>
           <h4 className="text-4xl font-black text-slate-800 tracking-tighter leading-none italic">{value}</h4>
           <div className="flex items-center justify-between mt-1">
             <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest leading-none">{title}</p>
             <span className="text-[10px] font-black text-[#006837] italic leading-none">{unit}</span>
           </div>
        </div>
     </div>
  );
}

function ExportCard({ title, desc, icon, color, onClick }) {
  return (
    <button onClick={onClick} className="bg-white p-8 rounded-[3rem] shadow-md text-left flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all group border italic leading-none">
      <div className={`p-5 rounded-[2rem] text-white ${color} group-hover:-rotate-6 transition-all shadow-lg`}>{icon}</div>
      <div className="flex-1 italic leading-none">
        <h3 className="font-black text-[#006837] uppercase italic leading-none">{title}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{desc}</p>
      </div>
      <Download size={20} className="text-[#FBB03B]" />
    </button>
  );
}

function DataCard({ title, sub, badge, image, icon, isAdmin, onEdit, onDelete, children }) {
  return (
    <div className="bg-white p-5 rounded-[2.5rem] shadow-md border-2 border-transparent hover:border-[#006837]/20 flex flex-col relative overflow-hidden transition-all group italic text-left">
      {badge && <div className="absolute top-0 right-0 bg-yellow-500 text-[#006837] text-[10px] font-black px-3 py-1.5 rounded-bl-[1.5rem] shadow-sm uppercase">{badge}</div>}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 bg-slate-100 rounded-[1.5rem] overflow-hidden flex items-center justify-center text-slate-300 border shadow-inner shrink-0">
          {image ? <img src={image} alt="" className="w-full h-full object-cover rounded-2xl" /> : icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-lg text-slate-800 leading-tight uppercase truncate italic">{title}</h3>
          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase truncate leading-none">{sub}</p>
        </div>
      </div>
      {children}
      {isAdmin && (
        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} title="Editar" className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"><Edit3 size={16}/></button>
          <button onClick={onDelete} title="Excluir" className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={16}/></button>
        </div>
      )}
    </div>
  );
}

function EntityList({ title, isAdmin, data, onAdd, renderItem }) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 mb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h2 className="text-3xl font-black text-[#006837] tracking-tight border-l-8 border-[#FBB03B] pl-4 uppercase italic leading-none">{title}</h2>
        {isAdmin && (
          <button onClick={onAdd} className="w-full md:w-auto bg-[#006837] text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase shadow-xl hover:bg-[#004d2a] transition-all active:scale-95">
            <PlusCircle size={24} /> Criar Novo
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{data && data.length > 0 ? data.map(renderItem) : <div className="col-span-full py-10 text-center text-slate-300 font-black uppercase tracking-widest opacity-40">Nenhum registro encontrado</div>}</div>
    </section>
  );
}

// --- Telas de Acesso ---

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); 
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAction = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setError(''); setSuccess('');
    const username = user.toLowerCase().trim();

    if (mode === 'login') {
      const { data, error: dbError } = await supabase.from('app_users').select('*').eq('username', username).eq('password', pass).single();
      if (dbError || !data) setError('Utilizador ou senha incorretos.');
      else if (data.status === 'rejeitado') setError('Acesso negado pelo administrador.');
      else onLogin(data);
    } else {
      const { error: dbError } = await supabase.from('app_users').insert([{ username, password: pass, status: 'pendente', is_admin: false }]);
      if (dbError) setError('Utilizador já cadastrado.');
      else { setSuccess('Solicitação enviada!'); setMode('login'); }
    }
  };

  return (
    <div className="min-h-screen bg-[#006837] flex items-center justify-center p-6 italic">
      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl w-full max-w-md space-y-8 border-b-[12px] border-yellow-500 animate-in fade-in slide-in-from-bottom-8 text-center">
        <div className="space-y-2">
          <ShieldCheck size={50} className="mx-auto text-[#006837]" />
          <h2 className="text-4xl font-black text-[#006837] tracking-tighter uppercase italic leading-none">LOG-SGB</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Unidade Serra Grande</p>
        </div>
        <form onSubmit={handleAction} className="space-y-4">
          <Input label="Utilizador" value={user} onChange={setUser} placeholder="apenas minúsculas" />
          <Input label="Senha" type="password" value={pass} onChange={setPass} placeholder="••••••••" />
          {error && <p className="text-red-500 text-[10px] font-black uppercase">{error}</p>}
          {success && <p className="text-emerald-600 text-[10px] font-black uppercase">{success}</p>}
          <button type="submit" className="w-full bg-[#006837] text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-[#004d2a]">
            {mode === 'login' ? 'Entrar' : 'Pedir Acesso'}
          </button>
        </form>
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-xs font-black text-[#006837] uppercase underline">
          {mode === 'login' ? 'Solicitar Acesso ao Sistema' : 'Já tenho conta cadastrada'}
        </button>
      </div>
    </div>
  );
}

function LoginModal({ onLogin, onClose }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user === 'mariorocha' && pass === '28172024') {
      onLogin({ username: 'mariorocha', isAdmin: true, status: 'aprovado' });
      onClose();
    } else {
      if (!supabase) return;
      const { data } = await supabase.from('app_users').select('*').eq('username', user.toLowerCase()).eq('password', pass).single();
      if (data && data.status === 'aprovado') { onLogin(data); onClose(); }
      else setError('Credenciais inválidas ou pendentes.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white italic">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50 shrink-0">
        <h2 className="text-2xl font-black text-[#006837] italic uppercase">Login Administrativo</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={24}/></button>
      </div>
      <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-center">
        <div className="space-y-6 max-w-sm mx-auto w-full">
          <Input label="Utilizador" value={user} onChange={setUser} />
          <Input label="Senha" type="password" value={pass} onChange={setPass} />
          {error && <p className="text-red-500 text-[10px] font-black text-center uppercase">{error}</p>}
        </div>
      </div>
      <div className="p-8 border-t shrink-0">
        <button onClick={handleSubmit} className="w-full bg-[#006837] text-white py-5 rounded-[2rem] font-black uppercase shadow-xl hover:bg-[#004d2a]">Confirmar</button>
      </div>
    </div>
  );
}

// --- Componentes dos Filtros ---

function DateFilter({ selectedMonth, selectedYear, onMonthChange, onYearChange }) {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="bg-white p-4 rounded-[2rem] shadow-lg border-2 border-slate-50 flex flex-wrap items-center gap-4 mb-8 italic">
      <div className="flex items-center gap-3 px-4 border-r border-slate-100">
        <Calendar size={20} className="text-[#006837]" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período Selecionado:</span>
      </div>
      <select 
        value={selectedMonth} 
        onChange={(e) => onMonthChange(parseInt(e.target.value))}
        className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-black text-[#006837] outline-none"
      >
        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
      </select>
      <select 
        value={selectedYear} 
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 font-black text-[#006837] outline-none"
      >
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// --- Dashboards ---

function HomeDashboard({ isSuperAdmin, onNavigate, pendingUsers, onApprove }) {
  const menuItems = [
    { id: 'shipments', title: 'CARREGAMENTOS', icon: <ClipboardList size={32}/>, color: 'bg-[#006837]', admin: true },
    { id: 'analytics', title: 'ESTATÍSTICAS', icon: <BarChart3 size={32}/>, color: 'bg-emerald-600', admin: false },
    { id: 'export', title: 'EXPORTAÇÕES', icon: <Download size={32}/>, color: 'bg-[#FBB03B]', admin: false },
    { id: 'products', title: 'PRODUTOS', icon: <Package size={32}/>, color: 'bg-emerald-700', admin: true },
    { id: 'drivers', title: 'MOTORISTAS', icon: <User size={32}/>, color: 'bg-[#004d2a]', admin: true },
    { id: 'trucks', title: 'FROTA', icon: <Truck size={32}/>, color: 'bg-slate-800', admin: true },
  ];

  const visibleItems = menuItems.filter(item => isSuperAdmin || !item.admin);

  return (
    <div className="space-y-12 py-6 italic uppercase">
      <div className="px-4 flex justify-between items-center">
        <h2 className="text-4xl font-black text-[#006837] italic">Painel Principal</h2>
        {isSuperAdmin && pendingUsers.length > 0 && (
          <div className="bg-yellow-400 p-3 rounded-2xl font-black flex items-center gap-2 border-2 border-[#006837] animate-bounce">
            <Users size={20} /> <span>{pendingUsers.length} PENDENTES</span>
          </div>
        )}
      </div>

      {isSuperAdmin && pendingUsers.length > 0 && (
        <section className="bg-white p-8 rounded-[3rem] shadow-xl border-l-[12px] border-l-yellow-500 animate-in fade-in slide-in-from-right-8 text-left">
           <h3 className="text-xl font-black text-[#006837] mb-6">Solicitações de Acesso</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map(u => (
                <div key={u.id} className="p-5 bg-slate-50 rounded-3xl border flex flex-col gap-4 shadow-inner">
                   <span className="font-black text-slate-700 uppercase tracking-widest">{u.username}</span>
                   <div className="flex gap-2">
                      <button onClick={() => onApprove(u.id, true)} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-black uppercase text-[10px]">Aprovar</button>
                      <button onClick={() => onApprove(u.id, false)} className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl font-black uppercase text-[10px]">Negar</button>
                   </div>
                </div>
              ))}
           </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {visibleItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="group relative bg-white p-8 rounded-[3rem] shadow-lg hover:shadow-2xl transition-all text-left flex flex-col justify-between overflow-hidden border-2 border-transparent hover:border-yellow-400 min-h-[200px]">
            <div className={`p-5 rounded-[2rem] text-white w-fit mb-6 ${item.color} shadow-lg transition-transform group-hover:rotate-3`}>{item.icon}</div>
            <h3 className="text-2xl font-black text-[#006837] flex items-center gap-3 italic uppercase">{item.title} <ChevronRight size={24} className="text-[#FBB03B]" /></h3>
            <div className={`absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-[0.05] ${item.color} group-hover:scale-150 transition-transform duration-700`} />
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Analytics View ---

function AnalyticsView({ filteredShipments, selectedMonthName }) {
  
  const stats = useMemo(() => {
    const metrics = { 
        totalHL: 0, totalRGBHL: 0, trips: filteredShipments.length, 
        driverStats: {}, productStats: {}, brandStats: {}, truckStats: {}
    };

    filteredShipments.forEach(s => {
      metrics.totalHL += (s.total_hl || 0);
      metrics.totalRGBHL += (s.total_rgb_hl || 0);
      
      if (!metrics.driverStats[s.motorista_id]) metrics.driverStats[s.motorista_id] = { name: s.motorista_nome, trips: 0, hl: 0 };
      metrics.driverStats[s.motorista_id].trips += 1;
      metrics.driverStats[s.motorista_id].hl += (s.total_hl || 0);

      if (!metrics.truckStats[s.placa_caminhao]) metrics.truckStats[s.placa_caminhao] = { trips: 0, hl: 0 };
      metrics.truckStats[s.placa_caminhao].trips += 1;
      metrics.truckStats[s.placa_caminhao].hl += (s.total_hl || 0);

      if (s.itens) {
        s.itens.forEach(i => {
           const qty = parseFloat(i.quantity || i.quantidade || 0);
           const hlItem = qty * (i.hlUnitario || 0);
           if (!metrics.productStats[i.codigo]) metrics.productStats[i.codigo] = { desc: i.descricao, qty: 0, hl: 0, rgb: i.rgb };
           metrics.productStats[i.codigo].qty += qty;
           metrics.productStats[i.codigo].hl += hlItem;
           const bName = i.marca || 'SGB';
           metrics.brandStats[bName] = (metrics.brandStats[bName] || 0) + hlItem;
        });
      }
    });

    return metrics;
  }, [filteredShipments]);

  const avgHL = stats.trips > 0 ? (stats.totalHL / stats.trips).toFixed(2) : "0.00";
  const rgbIdx = stats.totalHL > 0 ? ((stats.totalRGBHL / stats.totalHL) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24 italic uppercase">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={`Volume ${selectedMonthName}`} value={stats.totalHL.toFixed(2)} unit="HL" icon={<TrendingUp size={24}/>} color="bg-white" border="border-b-[10px] border-[#006837]" />
        <StatCard title="Mix Retornável" value={stats.totalRGBHL.toFixed(2)} unit="HL" icon={<Layers size={24}/>} color="bg-white" border="border-b-[10px] border-[#FBB03B]" />
        <StatCard title="Média por Carga" value={avgHL} unit="HL" icon={<Activity size={24}/>} color="bg-white" border="border-b-[10px] border-emerald-400" />
        <StatCard title="Aproveitamento" value={rgbIdx} unit="%" icon={<Target size={24}/>} color="bg-white" border="border-b-[10px] border-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] shadow-lg border text-left">
            <h3 className="text-2xl font-black text-[#006837] tracking-tighter uppercase mb-8 flex items-center gap-3 italic"><Award size={32} /> Performance de Motoristas</h3>
            <div className="space-y-4">
               {Object.values(stats.driverStats).sort((a,b) => b.hl - a.hl).slice(0,5).map((d, i) => (
                  <div key={i} className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2.5rem] shadow-inner transition-transform hover:scale-[1.01]">
                     <div className="w-12 h-12 bg-[#006837] text-white rounded-full flex items-center justify-center font-black italic shadow text-lg">#{i+1}</div>
                     <div className="flex-1 min-w-0"><p className="font-black text-slate-800 uppercase text-md truncate italic">{d.name}</p><p className="text-[10px] font-bold text-slate-400">{d.trips} Viagens</p></div>
                     <p className="font-black text-xl text-[#006837] italic">{d.hl.toFixed(1)} <span className="text-[10px] opacity-30">HL</span></p>
                  </div>
               ))}
            </div>
        </div>
        <div className="bg-white p-10 rounded-[4rem] shadow-lg border text-left">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-8 flex items-center gap-3 italic"><PieChart size={32} className="text-[#006837]" /> Mix Marcas</h3>
            <div className="space-y-5">
                {Object.entries(stats.brandStats).sort((a,b) => b[1] - a[1]).map(([brand, hl], i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500"><span>{brand}</span><span>{((hl/stats.totalHL)*100).toFixed(1)}%</span></div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden border"><div className="h-full bg-[#006837] transition-all" style={{ width: `${(hl/stats.totalHL*100)}%` }} /></div>
                  </div>
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[4rem] shadow-lg border text-left">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-8 flex items-center gap-3 italic"><Package className="text-emerald-600" size={32} /> Top 5 Produtos (Saída)</h3>
            <div className="space-y-4">
                {Object.values(stats.productStats).sort((a,b) => b.hl - a.hl).slice(0,5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] shadow-inner">
                     <div className="flex items-center gap-4">
                        <div className={`w-3 h-10 rounded-full ${p.rgb ? 'bg-yellow-500' : 'bg-[#006837]'}`} />
                        <div><p className="font-black text-slate-700 text-sm leading-none uppercase truncate max-w-[150px] italic">{p.desc}</p><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{p.qty} Unid.</p></div>
                     </div>
                     <p className="font-black text-xl text-slate-800 italic">{p.hl.toFixed(1)} <span className="text-[10px] opacity-40">HL</span></p>
                  </div>
                ))}
            </div>
         </div>
         <div className="bg-white p-10 rounded-[4rem] shadow-lg border text-left">
            <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase mb-8 flex items-center gap-3 italic"><Gauge className="text-orange-500" size={32} /> Uso de Veículos</h3>
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(stats.truckStats).sort((a,b) => b[1].trips - a[1].trips).slice(0,6).map(([plate, data], i) => (
                  <div key={i} className="p-6 bg-[#006837]/5 border-2 border-dashed border-[#006837]/10 rounded-[2rem] text-center">
                    <span className="font-black text-[#006837] text-lg block italic uppercase">{plate}</span>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase mb-2">{data.trips} Viagens</span>
                    <div className="bg-[#006837] text-white text-[10px] font-black py-1 rounded-full px-2">{data.hl.toFixed(1)} HL</div>
                  </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function ExportView({ shipments, products, drivers, trucks }) {
  const handleExport = (type) => {
      let data = []; let name = "RELATORIO";
      if (type === 'shipments') {
          shipments.forEach(s => s.itens?.forEach(i => data.push({ "Doc": s.documento_transporte, "NF": s.numero_nota_fiscal, "Data": s.data_nota_fiscal, "Motorista": s.motorista_nome, "Veículo": s.placa_caminhao, "Carreta": s.placa_carreta, "Marca": i.marca, "Produto": i.descricao, "Qtd": i.quantity || i.quantidade, "HL": ((i.quantity || i.quantidade) * (i.hlUnitario || 0)).toFixed(3), "Tipo": i.rgb ? "RGB" : "DESC" })));
          name = "CONSOLIDADO_CARGAS";
      } else if (type === 'products') {
          data = products.map(p => ({ "Código": p.codigo, "Descrição": p.descricao, "Marca": p.marca, "Volume_L": p.litragem, "HL_Pkt": p.hl_por_pacote, "Tipo": p.rgb ? "RGB" : "DESC" }));
          name = "BASE_TECNICA_PRODUTOS";
      } else if (type === 'drivers') {
          data = drivers.map(d => ({ "Nome": d.nome, "CPF": d.cpf, "Vgs": shipments.filter(s => s.motorista_id === d.id).length, "Total_HL": shipments.filter(s => s.motorista_id === d.id).reduce((acc, x) => acc + (x.total_hl || 0), 0).toFixed(2) }));
          name = "PERFORMANCE_EQUIPA";
      } else if (type === 'validades') {
          shipments.forEach(s => s.itens?.forEach(i => data.push({ "NF": s.numero_nota_fiscal, "Data": s.data_nota_fiscal, "Produto": i.descricao, "Lote_Validade": i.validade || "N/I", "Qtd": i.quantity || i.quantidade })));
          name = "AUDITORIA_VALIDADES";
      }
      downloadCSV(`LOG-SGB_${name}`, data);
  };
  return (
      <div className="max-w-4xl mx-auto space-y-10 py-10 animate-in fade-in italic">
          <div className="text-center space-y-2 italic"><h2 className="text-4xl font-black text-[#006837] tracking-tighter uppercase italic leading-none">Central de Ficheiros</h2><p className="text-slate-500 font-bold uppercase text-xs">Extração Inteligente Serra Grande (CSV)</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExportCard title="Movimentação Geral" desc="Lista mestre de todas as cargas e NFs" icon={<FileSpreadsheet size={32}/>} color="bg-[#006837]" onClick={() => handleExport('shipments')} />
              <ExportCard title="Performance Equipa" desc="Ranking de viagens e volumes por motorista" icon={<Award size={32}/>} color="bg-[#FBB03B]" onClick={() => handleExport('drivers')} />
              <ExportCard title="Catálogo de Produtos" desc="Base técnica de pesos, medidas e SKUs" icon={<Box size={32}/>} color="bg-slate-700" onClick={() => handleExport('products')} />
              <ExportCard title="Mapa de Validades" desc="Controlo de lotes e vencimentos por saída" icon={<Calendar size={32}/>} color="bg-emerald-600" onClick={() => handleExport('validades')} />
          </div>
      </div>
  );
}

// --- Formulários ---

function ProductForm({ data, onClose }) {
  const [form, setForm] = useState({ codigo: data?.codigo || '', descricao: data?.descricao || '', marca: data?.marca || '', litragem: data?.litragem || 0, unidades_por_pacote: data?.unidades_por_pacote || 0, quantidade_por_palete: data?.quantidade_por_palete || 0, rgb: data?.rgb || false, foto: data?.foto || '' });
  const [saving, setSaving] = useState(false);
  
  const handleSave = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    const hl = calculateHL(form.unidades_por_pacote, form.litragem);
    const payload = { ...form, hl_por_pacote: hl };
    if (data?.id) await supabase.from('products').update(payload).eq('id', data.id);
    else await supabase.from('products').insert([payload]);
    setSaving(false);
    onClose();
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full bg-white italic uppercase">
      <div className="p-8 border-b-4 border-[#006837] flex justify-between items-center bg-slate-50 shrink-0">
        <h2 className="text-2xl font-black text-[#006837] uppercase italic leading-none">{data ? 'Editar' : 'Novo'} SKU</h2>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={28}/></button>
      </div>
      <div className="flex-1 p-8 space-y-6 overflow-y-auto italic">
        <ImageUpload current={form.foto} onImageSelect={v => setForm(f => ({...f, foto: v}))} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Código" value={form.codigo} onChange={v => setForm(f => ({...f, codigo: v}))} required />
          <Input label="Fabricante" value={form.marca} onChange={v => setForm(f => ({...f, marca: v}))} required />
        </div>
        <Input label="Descrição" value={form.descricao} onChange={v => setForm(f => ({...f, descricao: v}))} required />
        <div className="flex items-center justify-between p-6 bg-[#006837]/5 rounded-[2.5rem] border-2 border-dashed border-[#006837]/20">
           <span className="text-sm font-black text-[#006837] uppercase italic">RGB (Retornável)?</span>
           <button type="button" onClick={() => setForm(f => ({...f, rgb: !f.rgb}))} className={`w-16 h-8 rounded-full flex items-center px-1.5 shadow-inner transition-all ${form.rgb ? 'bg-[#006837]' : 'bg-slate-300'}`}><div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.rgb ? 'translate-x-8' : ''}`} /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Litros" type="number" step="0.001" value={form.litragem} onChange={v => setForm(f => ({...f, litragem: v}))}/>
          <Input label="Pkt" type="number" value={form.unidades_por_pacote} onChange={v => setForm(f => ({...f, unidades_por_pacote: v}))}/>
          <Input label="Palete" type="number" value={form.quantidade_por_palete} onChange={v => setForm(f => ({...f, quantidade_por_palete: v}))}/>
        </div>
      </div>
      <div className="p-8 bg-slate-50 border-t shrink-0"><button type="submit" disabled={saving} className="w-full bg-[#006837] text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:bg-[#004d2a] disabled:opacity-50">{saving ? 'Gravando...' : 'Salvar Alterações'}</button></div>
    </form>
  );
}

function DriverForm({ data, onClose }) {
  const [form, setForm] = useState({ nome: data?.nome || '', cpf: data?.cpf || '', data_nascimento: data?.data_nascimento || '', foto: data?.foto || '' });
  const [saving, setSaving] = useState(false);
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); if (data?.id) await supabase.from('drivers').update(form).eq('id', data.id); else await supabase.from('drivers').insert([form]); setSaving(false); onClose(); };
  return (
    <form onSubmit={handleSave} className="flex flex-col h-full bg-white italic uppercase">
      <div className="p-8 border-b-4 border-[#006837] flex justify-between items-center bg-slate-50 shrink-0"><h2 className="text-2xl font-black text-[#006837] italic uppercase">Motorista</h2><button type="button" onClick={onClose}><X size={28}/></button></div>
      <div className="flex-1 p-8 space-y-6 overflow-y-auto italic">
        <ImageUpload current={form.foto} onImageSelect={v => setForm(f => ({...f, foto: v}))} />
        <Input label="Nome Completo" value={form.nome} onChange={v => setForm(f => ({...f, nome: v}))} required />
        <div className="grid grid-cols-2 gap-4"><Input label="CPF" value={form.cpf} onChange={v => setForm(f => ({...f, cpf: v}))} required /><Input label="Nasc." type="date" value={form.data_nascimento} onChange={v => setForm(f => ({...f, data_nascimento: v}))} required /></div>
      </div>
      <div className="p-8 bg-slate-50 border-t shrink-0"><button type="submit" disabled={saving} className="w-full bg-[#006837] text-white py-5 rounded-2xl font-black uppercase shadow-xl italic">{saving ? 'A processar...' : 'Salvar'}</button></div>
    </form>
  );
}

function TruckForm({ data, onClose }) {
  const [form, setForm] = useState({ placa: data?.placa || '', modelo: data?.modelo || '', foto: data?.foto || '' });
  const [saving, setSaving] = useState(false);
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); const payload = { ...form, placa: form.placa.toUpperCase() }; if (data?.id) await supabase.from('trucks').update(payload).eq('id', data.id); else await supabase.from('trucks').insert([payload]); setSaving(false); onClose(); };
  return (
    <form onSubmit={handleSave} className="flex flex-col h-full bg-white italic uppercase">
      <div className="p-8 border-b-4 border-[#006837] flex justify-between items-center bg-slate-50 shrink-0"><h2 className="text-2xl font-black text-[#006837] italic uppercase">Camião</h2><button type="button" onClick={onClose}><X size={28}/></button></div>
      <div className="flex-1 p-8 space-y-6 overflow-y-auto italic">
        <ImageUpload current={form.foto} onImageSelect={v => setForm(f => ({...f, foto: v}))} />
        <Input label="Matrícula" value={form.placa} onChange={v => setForm(f => ({...f, placa: v.toUpperCase()}))} required />
        <Input label="Marca/Modelo" value={form.modelo} onChange={v => setForm(f => ({...f, modelo: v}))} required />
      </div>
      <div className="p-8 bg-slate-50 border-t shrink-0"><button type="submit" disabled={saving} className="w-full bg-[#006837] text-white py-5 rounded-2xl font-black uppercase shadow-xl italic">{saving ? 'Gravando...' : 'Salvar'}</button></div>
    </form>
  );
}

function TrailerForm({ data, onClose }) {
  const [form, setForm] = useState({ placa: data?.placa || '', foto: data?.foto || '' });
  const [saving, setSaving] = useState(false);
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); const payload = { ...form, placa: form.placa.toUpperCase() }; if (data?.id) await supabase.from('trailers').update(payload).eq('id', data.id); else await supabase.from('trailers').insert([payload]); setSaving(false); onClose(); };
  return (
    <form onSubmit={handleSave} className="flex flex-col h-full bg-white italic uppercase">
      <div className="p-8 border-b-4 border-[#006837] flex justify-between items-center bg-slate-50 shrink-0"><h2 className="text-2xl font-black text-[#006837] italic uppercase">Carreta</h2><button type="button" onClick={onClose}><X size={28}/></button></div>
      <div className="flex-1 p-8 space-y-6 overflow-y-auto italic">
        <ImageUpload current={form.foto} onImageSelect={v => setForm(f => ({...f, foto: v}))} />
        <Input label="Matrícula Carreta" value={form.placa} onChange={v => setForm(f => ({...f, placa: v.toUpperCase()}))} required />
      </div>
      <div className="p-8 bg-slate-50 border-t shrink-0"><button type="submit" disabled={saving} className="w-full bg-[#006837] text-white py-5 rounded-2xl font-black uppercase shadow-xl italic">{saving ? 'Gravando...' : 'Salvar'}</button></div>
    </form>
  );
}

function LinkTruckForm({ truck, trailers, onClose }) {
  const handleLink = async (trailerId) => { if (!supabase) return; await supabase.from('trucks').update({ carreta_atrelada_id: trailerId }).eq('id', truck.id); onClose(); };
  return (
    <div className="flex flex-col h-full bg-white italic uppercase">
      <div className="p-8 border-b-4 border-[#006837] flex justify-between items-center bg-slate-50 shrink-0"><h2 className="text-2xl font-black text-[#006837] text-center leading-none">Vincular Carreta</h2><button type="button" onClick={onClose}><X size={28}/></button></div>
      <div className="flex-1 p-8 space-y-3 overflow-y-auto italic">
        <button onClick={() => handleLink(null)} className="w-full p-5 border-4 border-dashed rounded-[1.5rem] text-slate-400 font-black italic uppercase">Remover Vínculo</button>
        {trailers.map(tr => (
          <button key={tr.id} onClick={() => handleLink(tr.id)} className={`w-full p-5 border-2 rounded-[1.5rem] text-left font-black flex justify-between items-center ${truck.carreta_atrelada_id === tr.id ? 'bg-[#006837]/5 border-[#006837]' : 'border-slate-100'}`}>
            <span>{tr.placa}</span> {truck.carreta_atrelada_id === tr.id && <Check className="text-[#006837]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ShipmentWizard({ onClose, products, drivers, trucks, trailers }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ documento_transporte: '', numero_nota_fiscal: '', data_nota_fiscal: '', motorista_id: '', motorista_nome: '', truck_id: '', placa_caminhao: '', placa_carreta: '', itens: [], total_hl: 0, total_rgb_hl: 0, cpf_search: '', truck_search: '' });
  const [currentProductCode, setCurrentProductCode] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [currentVal, setCurrentVal] = useState('');
  const [foundProduct, setFoundProduct] = useState(null);
  const addItem = () => { if (!foundProduct) return; setFormData(prev => ({ ...prev, itens: [...prev.itens, { codigo: foundProduct.codigo, descricao: foundProduct.descricao, marca: foundProduct.marca, quantity: currentQty, validade: currentVal, hlUnitario: foundProduct.hl_por_pacote, rgb: !!foundProduct.rgb }] })); setCurrentProductCode(''); setFoundProduct(null); };
  const finish = async () => { const hl = formData.itens.reduce((acc, i) => acc + (parseFloat(i.quantity) * i.hlUnitario), 0); const rgbHl = formData.itens.reduce((acc, i) => i.rgb ? acc + (parseFloat(i.quantity) * i.hlUnitario) : acc, 0); await supabase.from('shipments').insert([{ ...formData, total_hl: hl, total_rgb_hl: rgbHl, created_at: new Date().toISOString() }]); onClose(); };
  return (
    <div className="flex flex-col h-full bg-white italic uppercase">
      <div className="p-8 border-b-4 border-[#006837] flex justify-between items-center bg-slate-50 italic shrink-0"><h2 className="text-xl font-black text-[#006837]">Etapa {step} / 4</h2><button type="button" onClick={onClose}><X size={24}/></button></div>
      <div className="flex-1 p-8 overflow-y-auto italic">
        {step === 1 && <div className="space-y-6 max-w-sm mx-auto animate-in fade-in">
            <Input label="Doc. Transporte" value={formData.documento_transporte} onChange={v => setFormData(p => ({...p, documento_transporte: v}))}/>
            <Input label="Número NF" value={formData.numero_nota_fiscal} onChange={v => setFormData(p => ({...p, numero_nota_fiscal: v}))}/>
            <Input label="Data Carga" type="date" value={formData.data_nota_fiscal} onChange={v => setFormData(p => ({...p, data_nota_fiscal: v}))}/>
          </div>}
        {step === 2 && <div className="space-y-6 max-w-sm mx-auto animate-in fade-in">
            <Input label="CPF Condutor" value={formData.cpf_search} onChange={v => { const d = drivers.find(drv => drv.cpf === v); setFormData(p => ({...p, cpf_search: v, motorista_id: d?.id || '', motorista_nome: d?.nome || ''})); }}/>
            {formData.motorista_nome && <div className="p-6 bg-[#006837]/5 text-[#006837] rounded-[2rem] border-2 border-dashed font-black text-center">{formData.motorista_nome}</div>}
          </div>}
        {step === 3 && <div className="space-y-6 max-w-sm mx-auto animate-in fade-in">
            <Input label="Placa Camião" value={formData.truck_search} onChange={v => { const t = trucks.find(trk => trk.placa === v.toUpperCase()); const tr = trailers.find(trail => trail.id === t?.carreta_atrelada_id); setFormData(p => ({...p, truck_search: v.toUpperCase(), truck_id: t?.id || '', placa_caminhao: t?.placa || '', placa_carreta: tr?.placa || 'N/A'})); }}/>
            {formData.truck_id && <div className="space-y-2 italic"><div className="p-5 bg-blue-50 text-blue-800 rounded-3xl border font-black text-center uppercase italic">{formData.placa_caminhao}</div><div className="p-5 bg-yellow-50 text-yellow-800 rounded-3xl border font-black text-center italic uppercase">{formData.placa_carreta}</div></div>}
          </div>}
        {step === 4 && <div className="space-y-6 animate-in fade-in">
            <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed space-y-4 italic">
              <Input label="Cód. SKU SGB" value={currentProductCode} onChange={v => { setCurrentProductCode(v); setFoundProduct(products.find(p => p.codigo === v)); }}/>
              {foundProduct && (
                <div className="p-4 bg-white rounded-2xl border shadow-xl italic"><p className="font-black text-sm uppercase italic mb-4">{foundProduct.descricao}</p><div className="grid grid-cols-2 gap-3"><Input label="Qtd" type="number" value={currentQty} onChange={setCurrentQty}/><Input label="Val" type="date" value={currentVal} onChange={setCurrentVal}/></div><button onClick={addItem} className="w-full bg-[#006837] text-white py-4 rounded-xl font-black uppercase mt-4 active:scale-95">Add</button></div>
              )}</div><div className="space-y-3">{formData.itens.map((i, idx) => <div key={idx} className={`p-4 border-2 rounded-2xl flex justify-between bg-white italic ${i.rgb ? 'border-[#FBB03B]' : 'border-slate-50'}`}><div className="text-sm"><p className="font-black text-[#006837] uppercase leading-none">{i.descricao}</p><p className="text-[10px] mt-1 uppercase italic">{i.quantity} PKT</p></div><p className="font-black text-lg italic">{(i.quantity * i.hlUnitario).toFixed(2)} HL</p></div>)}{formData.itens.length > 0 && <div className="bg-[#006837] p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl border-b-8 border-[#FBB03B]"><div><span className="text-[10px] font-black uppercase opacity-60">Total</span><h4 className="text-4xl font-black italic">{formData.itens.reduce((acc, i) => acc + (parseFloat(i.quantity) * i.hlUnitario), 0).toFixed(3)}</h4></div><button onClick={finish} className="bg-white text-[#006837] px-8 py-3 rounded-xl font-black uppercase shadow-lg italic active:scale-95">Gravar</button></div>}</div></div>}
      </div>
      <div className="p-8 bg-slate-50 border-t flex gap-4 shrink-0 italic">{step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 bg-white border-2 py-4 rounded-2xl font-black italic">Voltar</button>}{step < 4 && <button disabled={(step === 1 && !formData.documento_transporte) || (step === 2 && !formData.motorista_id) || (step === 3 && !formData.truck_id)} onClick={() => setStep(step + 1)} className="flex-1 bg-[#006837] text-white py-4 rounded-2xl font-black shadow-xl disabled:opacity-30 italic">Prox</button>}</div>
    </div>
  );
}

// --- Componente Raiz ---

function App() {
  const [session, setSession] = useState(null); 
  const [activeTab, setActiveTab] = useState('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null); 
  const [editData, setEditData] = useState(null);
  const [deleteConfig, setDeleteConfig] = useState(null); // { table, id, name }
  const [loading, setLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);
  
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [products, setProducts] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);

  const isSuperAdmin = session?.username === 'mariorocha';
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js';
    script.async = true;
    script.onload = () => {
      if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setDbReady(true);
      }
    };
    document.body.appendChild(script);
  }, []);

  const fetchData = async () => {
    if (!supabase || !session) return;
    setLoading(true);
    try {
      const [p, d, t, tr, s] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('drivers').select('*'),
        supabase.from('trucks').select('*'),
        supabase.from('trailers').select('*'),
        supabase.from('shipments').select('*').order('created_at', { ascending: false })
      ]);
      setProducts(p.data || []);
      setDrivers(d.data || []);
      setTrucks(t.data || []);
      setTrailers(tr.data || []);
      setShipments(s.data || []);

      if (isSuperAdmin) {
        const { data: uData } = await supabase.from('app_users').select('*').eq('status', 'pendente');
        setPendingUsers(uData || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (dbReady && session) fetchData();
  }, [dbReady, session]);

  const handleConfirmDelete = async () => {
    if (!supabase || !deleteConfig) return;
    const { error } = await supabase.from(deleteConfig.table).delete().eq('id', deleteConfig.id);
    if (error) alert("Erro ao excluir: " + error.message);
    else {
      setDeleteConfig(null);
      fetchData();
    }
  };

  const handleApproveUser = async (userId, approve) => {
    if (!supabase) return;
    const status = approve ? 'aprovado' : 'rejeitado';
    const { error } = await supabase.from('app_users').update({ status }).eq('id', userId);
    if (!error) fetchData();
  };

  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (!s.data_nota_fiscal) return false;
      const date = new Date(s.data_nota_fiscal);
      return date.getMonth() === filterMonth && date.getFullYear() === filterYear;
    });
  }, [shipments, filterMonth, filterYear]);

  if (!dbReady) return (
    <div className="min-h-screen bg-[#f4f7f1] flex items-center justify-center italic text-[#006837] font-black uppercase">
       <RefreshCw className="animate-spin mr-3" size={32} /> Sincronizando SGB...
    </div>
  );

  if (!session) return <LoginScreen onLogin={setSession} />;

  if (session.status === 'pendente') return (
    <div className="min-h-screen bg-[#006837] flex items-center justify-center p-6 italic text-center text-white">
       <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full space-y-6 border-b-[10px] border-yellow-500 text-slate-800">
          <Clock size={60} className="mx-auto text-yellow-500 animate-pulse" />
          <h2 className="text-2xl font-black text-[#006837] uppercase italic leading-none">Acesso Pendente</h2>
          <p className="text-slate-500 font-bold leading-relaxed text-center italic">Olá, <span className="text-[#006837]">{session.username}</span>! Seu cadastro foi realizado. Aguarde a aprovação de <b>mariorocha</b> para entrar.</p>
          <button onClick={() => setSession(null)} className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase hover:bg-slate-200 italic">Voltar para Login</button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f1] text-slate-900 font-sans flex flex-col italic">
      <header className="bg-[#006837] text-white p-5 shadow-xl flex justify-between items-center sticky top-0 z-50 border-b-4 border-[#FBB03B]">
        <div className="flex items-center gap-4">
          {activeTab !== 'home' && (
            <button onClick={() => setActiveTab('home')} className="p-2 hover:bg-white/10 rounded-full border border-white/20 transition-all">
              <ArrowLeft size={24} />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter leading-none italic uppercase">LOG-SGB</h1>
            <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-[0.2em] italic">Unidade Serra Grande</p>
          </div>
        </div>
        <div className="flex items-center gap-3 italic">
          <div className="hidden md:flex flex-col items-end mr-1">
            <span className="text-[9px] font-black uppercase text-yellow-400 leading-none">{isSuperAdmin ? 'Super Admin' : 'Operador'}</span>
            <span className="text-xs font-bold leading-none uppercase italic">{session.username}</span>
          </div>
          <button onClick={() => setSession(null)} className="p-2.5 bg-red-600/20 hover:bg-red-600 text-white rounded-xl transition-all border border-red-500/30">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full italic">
        {activeTab === 'home' && <HomeDashboard isSuperAdmin={isSuperAdmin} onNavigate={setActiveTab} pendingUsers={pendingUsers} onApprove={handleApproveUser} />}
        
        {(activeTab === 'analytics' || activeTab === 'shipments') && (
          <DateFilter selectedMonth={filterMonth} selectedYear={filterYear} onMonthChange={setFilterMonth} onYearChange={setFilterYear} />
        )}

        {activeTab === 'analytics' && <AnalyticsView filteredShipments={filteredShipments} selectedMonthName={monthNames[filterMonth]} />}
        {activeTab === 'export' && <ExportView shipments={shipments} products={products} drivers={drivers} trucks={trucks} />}
        
        {activeTab === 'products' && (
          <EntityList title="Produtos" isAdmin={isSuperAdmin} data={products} onAdd={() => { setEditData(null); setModalType('product'); setIsModalOpen(true); }}
            renderItem={(p) => (
              <DataCard key={p.id} title={p.descricao} sub={`${p.marca} | Cod: ${p.codigo}`} badge={p.rgb ? "RGB" : null} image={p.foto} icon={<Package size={24}/>} isAdmin={isSuperAdmin} onEdit={() => { setEditData(p); setModalType('product'); setIsModalOpen(true); }} onDelete={() => setDeleteConfig({ table: 'products', id: p.id, name: p.descricao })}>
                <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase italic"><span>Litros: {p.litragem}L</span><span className="text-[#006837]">HL/Pkt: {p.hl_por_pacote?.toFixed(4)}</span></div>
              </DataCard>
            )}
          />
        )}

        {activeTab === 'drivers' && (
          <EntityList title="Motoristas" isAdmin={isSuperAdmin} data={drivers} onAdd={() => { setEditData(null); setModalType('driver'); setIsModalOpen(true); }}
            renderItem={(d) => (
              <DataCard key={d.id} title={d.nome} sub={`CPF: ${d.cpf}`} image={d.foto} icon={<User size={24}/>} isAdmin={isSuperAdmin} onEdit={() => { setEditData(d); setModalType('driver'); setIsModalOpen(true); }} onDelete={() => setDeleteConfig({ table: 'drivers', id: d.id, name: d.nome })} />
            )}
          />
        )}

        {activeTab === 'trucks' && (
          <div className="space-y-16 italic text-left">
            <EntityList title="Camiões" isAdmin={isSuperAdmin} data={trucks} onAdd={() => { setEditData(null); setModalType('truck'); setIsModalOpen(true); }}
              renderItem={(t) => {
                const trailer = trailers.find(tr => tr.id === t.carreta_atrelada_id);
                return (
                  <DataCard key={t.id} title={t.placa} sub={t.modelo} image={t.foto} icon={<Truck size={24}/>} isAdmin={isSuperAdmin} onEdit={() => { setEditData(t); setModalType('truck'); setIsModalOpen(true); }} onDelete={() => setDeleteConfig({ table: 'trucks', id: t.id, name: t.placa })}>
                    <div className="mt-3 p-3 bg-slate-50 border-2 border-dashed rounded-xl flex justify-between items-center shadow-inner italic"><span className="text-[9px] font-black text-slate-400 italic">Vínculo:</span><span className="text-xs font-black text-[#006837] uppercase italic">{trailer ? trailer.placa : 'Nenhum'}</span></div>
                    {isSuperAdmin && <button onClick={() => { setEditData(t); setModalType('linkTruck'); setIsModalOpen(true); }} className="w-full mt-2 text-[10px] font-black text-blue-600 uppercase hover:underline italic">Alterar Carreta</button>}
                  </DataCard>
                );
              }}
            />
            <EntityList title="Carretas" isAdmin={isSuperAdmin} data={trailers} onAdd={() => { setEditData(null); setModalType('trailer'); setIsModalOpen(true); }}
              renderItem={(tr) => (
                <DataCard key={tr.id} title={tr.placa} sub="Implemento" image={tr.foto} icon={<Truck size={24} className="rotate-180"/>} isAdmin={isSuperAdmin} onEdit={() => { setEditData(tr); setModalType('trailer'); setIsModalOpen(true); }} onDelete={() => setDeleteConfig({ table: 'trailers', id: tr.id, name: tr.placa })} />
              )}
            />
          </div>
        )}

        {activeTab === 'shipments' && (
          <EntityList title="Carregamentos" isAdmin={isSuperAdmin} data={filteredShipments} onAdd={() => { setEditData(null); setModalType('shipment'); setIsModalOpen(true); }}
            renderItem={(s) => (
              <div key={s.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border-l-[12px] border-l-[#006837] relative transition-transform hover:scale-[1.01] italic text-left">
                <div className="flex justify-between items-start mb-4 italic">
                  <div><h3 className="font-black text-xl tracking-tighter uppercase italic leading-none">DOC: {s.documento_transporte}</h3><p className="text-[9px] font-black text-slate-400 mt-1 uppercase italic">NF: {s.numero_nota_fiscal} • {new Date(s.data_nota_fiscal).toLocaleDateString()}</p></div>
                  <div className="text-right text-[#006837] italic"><p className="text-2xl font-black leading-none italic">{(s.total_hl || 0).toFixed(3)}</p><p className="text-[9px] font-black uppercase italic">HL Total</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-3xl border mb-3 shadow-inner italic">
                  <div><span className="text-[8px] text-slate-400 uppercase font-black block mb-1 italic">Motorista</span><span className="font-bold text-xs truncate block uppercase italic">{s.motorista_nome}</span></div>
                  <div className="text-right"><span className="text-[8px] text-slate-400 uppercase font-black block mb-1 italic">Camião</span><span className="font-black text-xs uppercase text-[#006837] italic">{s.placa_caminhao}</span></div>
                </div>
                {isSuperAdmin && <div className="flex justify-end pt-2 border-t border-slate-100 italic"><button onClick={() => setDeleteConfig({ table: 'shipments', id: s.id, name: `NF ${s.numero_nota_fiscal}` })} className="p-2 text-red-400 hover:text-red-600 transition-colors italic"><Trash2 size={20}/></button></div>}
              </div>
            )}
          />
        )}
      </main>

      {/* Modais de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#006837]/80 backdrop-blur-md italic">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300 overflow-hidden italic">
            {modalType === 'login' && <LoginModal onLogin={setSession} onClose={() => setIsModalOpen(false)} />}
            {modalType === 'product' && <ProductForm data={editData} onClose={() => { setIsModalOpen(false); fetchData(); }} />}
            {modalType === 'driver' && <DriverForm data={editData} onClose={() => { setIsModalOpen(false); fetchData(); }} />}
            {modalType === 'truck' && <TruckForm data={editData} onClose={() => { setIsModalOpen(false); fetchData(); }} />}
            {modalType === 'trailer' && <TrailerForm data={editData} onClose={() => { setIsModalOpen(false); fetchData(); }} />}
            {modalType === 'linkTruck' && <LinkTruckForm truck={editData} trailers={trailers} onClose={() => { setIsModalOpen(false); fetchData(); }} />}
            {modalType === 'shipment' && <ShipmentWizard onClose={() => { setIsModalOpen(false); fetchData(); }} products={products} drivers={drivers} trucks={trucks} trailers={trailers} />}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão Customizado */}
      {deleteConfig && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm italic">
           <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <Trash2 size={32} />
                 </div>
                 <h2 className="text-xl font-black text-slate-800 uppercase italic">Confirmar Exclusão?</h2>
                 <p className="text-slate-500 text-sm italic">Você está prestes a apagar <b>{deleteConfig.name}</b> permanentemente da base do LOG-SGB. Esta ação não pode ser desfeita.</p>
                 <div className="flex gap-4 w-full pt-4">
                    <button onClick={() => setDeleteConfig(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all">Cancelar</button>
                    <button onClick={handleConfirmDelete} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-red-600 shadow-lg shadow-red-200 transition-all">Excluir Agora</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export { App as default };