import { useState } from 'react';
import { 
  ClipboardList, 
  LayoutDashboard, 
  ShieldCheck, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'admin' | 'dashboard'>('form');

  // Örnek başlangıç verileri
  const [talepListesi, setTalepListesi] = useState([
    { id: 'TLP-001', adSoyad: 'Ahmet Yılmaz', departman: 'Üretim', oncelik: 'Yüksek', durum: 'İnceleniyor', tarih: '2026-10-14', aciklama: 'Pres hattı 3 numaralı hidrolik valf kontrolü talebi.' },
    { id: 'TLP-002', adSoyad: 'Mehmet Demir', departman: 'Bakım', oncelik: 'Acil', durum: 'Beklemede', tarih: '2026-10-14', aciklama: 'Ana pano sigorta değişimi ve periyodik ölçüm.' },
    { id: 'TLP-003', adSoyad: 'Ayşe Kaya', departman: 'Kalite', oncelik: 'Normal', durum: 'Tamamlandı', tarih: '2026-10-13', aciklama: 'Laboratuvar kalibrasyon cihazı yazılım güncellemesi.' },
  ]);

  const [yeniTalep, setYeniTalep] = useState({
    adSoyad: '',
    departman: 'Üretim',
    oncelik: 'Normal',
    baslik: '',
    aciklama: '',
  });

  const [gonderildi, setGonderildi] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yeniTalep.adSoyad || !yeniTalep.aciklama) return;

    const yeniId = `TLP-00${talepListesi.length + 1}`;
    setTalepListesi([
      {
        id: yeniId,
        adSoyad: yeniTalep.adSoyad,
        departman: yeniTalep.departman,
        oncelik: yeniTalep.oncelik,
        durum: 'Beklemede',
        tarih: new Date().toISOString().split('T')[0],
        aciklama: yeniTalep.aciklama,
      },
      ...talepListesi,
    ]);

    setGonderildi(true);
    setYeniTalep({ adSoyad: '', departman: 'Üretim', oncelik: 'Normal', baslik: '', aciklama: '' });
    setTimeout(() => setGonderildi(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Üst Başlık & Navigasyon */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl tracking-wider text-white shadow-inner">
              AKG
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">İş İstek Formu Sistemi</h1>
              <p className="text-xs text-slate-400">Talep Kayıt, Yönetim & Dashboard Portalı</p>
            </div>
          </div>

          <nav className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-sm">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition font-medium ${
                activeTab === 'form'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              İş İstek Formu
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition font-medium ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition font-medium ${
                activeTab === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Yönetici Paneli
            </button>
          </nav>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* TAB 1: FORM */}
        {activeTab === 'form' && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ClipboardList className="w-6 h-6" /> Yeni İş / Talep Formu
              </h2>
              <p className="text-blue-100 text-xs mt-1">
                Lütfen arıza, bakım veya geliştirme talebinizi eksiksiz doldurunuz.
              </p>
            </div>

            {gonderildi && (
              <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Talebiniz başarıyla kaydedildi! Takip numaranız oluşturuldu.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ad Soyad / Talep Eden
                  </label>
                  <input
                    type="text"
                    required
                    value={yeniTalep.adSoyad}
                    onChange={(e) => setYeniTalep({ ...yeniTalep, adSoyad: e.target.value })}
                    placeholder="Adınız Soyadınız"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departman / Bölüm
                  </label>
                  <select
                    value={yeniTalep.departman}
                    onChange={(e) => setYeniTalep({ ...yeniTalep, departman: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Üretim">Üretim</option>
                    <option value="Bakım & Onarım">Bakım & Onarım</option>
                    <option value="Kalite Güvence">Kalite Güvence</option>
                    <option value="Depo & Lojistik">Depo & Lojistik</option>
                    <option value="Bilgi İşlem (IT)">Bilgi İşlem (IT)</option>
                    <option value="İdari İşler">İdari İşler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Öncelik Derecesi
                  </label>
                  <select
                    value={yeniTalep.oncelik}
                    onChange={(e) => setYeniTalep({ ...yeniTalep, oncelik: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Normal">Normal</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Acil">Acil (Üretim Durdu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Talep Konusu / Başlık
                  </label>
                  <input
                    type="text"
                    value={yeniTalep.baslik}
                    onChange={(e) => setYeniTalep({ ...yeniTalep, baslik: e.target.value })}
                    placeholder="Örn: Arıza Bildirimi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Talep / İş Açıklaması
                </label>
                <textarea
                  rows={4}
                  required
                  value={yeniTalep.aciklama}
                  onChange={(e) => setYeniTalep({ ...yeniTalep, aciklama: e.target.value })}
                  placeholder="Yapılması istenen işi, lokasyonu ve detayları detaylıca belirtiniz..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-4 h-4" />
                Talebi Gönder
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Toplam Talep</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{talepListesi.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Bekleyen Talepler</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {talepListesi.filter(t => t.durum === 'Beklemede').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">İncelenen / İşlemde</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {talepListesi.filter(t => t.durum === 'İnceleniyor').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">Tamamlanan</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {talepListesi.filter(t => t.durum === 'Tamamlandı').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Son Talepler Özeti */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
                Güncel Talep Durumları
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                    <tr>
                      <th className="py-3 px-4">Talep No</th>
                      <th className="py-3 px-4">Talep Eden</th>
                      <th className="py-3 px-4">Departman</th>
                      <th className="py-3 px-4">Öncelik</th>
                      <th className="py-3 px-4">Tarih</th>
                      <th className="py-3 px-4">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {talepListesi.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-medium text-blue-600">{item.id}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{item.adSoyad}</td>
                        <td className="py-3 px-4 text-slate-600">{item.departman}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.oncelik === 'Acil'
                                ? 'bg-red-100 text-red-700'
                                : item.oncelik === 'Yüksek'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.oncelik}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{item.tarih}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.durum === 'Tamamlandı'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.durum === 'İnceleniyor'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.durum}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ADMIN */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Yönetici Onay & İşlem Masası
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gelen talepleri inceleyin, durumlarını güncelleyin ve Google Sheets ile senkronize edin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Google Sheets Bağlantısı Hazır
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {talepListesi.map((talep) => (
                  <div
                    key={talep.id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {talep.id}
                        </span>
                        <span className="font-semibold text-slate-800 text-sm">{talep.adSoyad}</span>
                        <span className="text-xs text-slate-500">({talep.departman})</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            talep.oncelik === 'Acil'
                              ? 'bg-red-100 text-red-700 font-bold'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {talep.oncelik}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{talep.aciklama}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={talep.durum}
                        onChange={(e) => {
                          const yeniDurum = e.target.value;
                          setTalepListesi(
                            talepListesi.map((t) =>
                              t.id === talep.id ? { ...t, durum: yeniDurum } : t
                            )
                          );
                        }}
                        className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Beklemede">Beklemede</option>
                        <option value="İnceleniyor">İnceleniyor</option>
                        <option value="Tamamlandı">Tamamlandı</option>
                        <option value="İptal Edildi">İptal Edildi</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
