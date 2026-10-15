# Akıllı Bakım Yardımcı Asistanı ve İnteraktif Arıza Bildirim Sistemi

Kullanıcıların arıza ve bakım taleplerini samimi, anlaşılır ve adım adım yönlendiren 3D bir "Bakım Yardımcı Robotu" eşliğinde; konuşma balonları, saate göre otomatik seçilen vardiya ve hızlı seçim butonlarıyla kolayca iletebilmesini sağlayan modern kullanıcı arayüzü mimarisi.

### Kullanıcı Onayı ve Kritik Kararlar

> [!IMPORTANT]
> Sistem hayata geçirilmeden önce aşağıdaki temel mimari ve kullanıcı deneyimi kararları teyit edilmiştir:

- **Yardımcı Karakter / Maskot**: Sevimli, endüstriyel kasklı ve anahtarlı 3D teknik bakım robotu maskotu (`generate_image` ile üretilecek yüksek çözünürlüklü asistan görseli). Her adımda ilgili soruyu konuşma balonunda ("Lütfen adınızı soyadınızı girer misiniz?", "Problem hangi bölümde?") soracaktır.
- **Otomatik Vardiya Algılama**: Cihazın yerel saatine göre vardiya otomatik hesaplanıp seçilecektir:
  - `08:00 - 16:00`: 1. Vardiya (08:00 - 16:00)
  - `16:00 - 24:00`: 2. Vardiya (16:00 - 24:00)
  - `00:00 - 08:00`: 3. Vardiya (24:00 - 08:00)
  (Kullanıcı dilerse vardiyayı manuel olarak da değiştirebilecektir).
- **İkili Kullanım Modu**: Varsayılan olarak konuşma balonlu interaktif asistan deneyimi açılacak; dileyen kullanıcılar tek tıkla kompakt liste moduna geçiş yapabilecektir.

---

### 1. Genel Bakış ve Temel Konsept

- **Ne Yapıyor?**: Fabrika ve tesis çalışanları bir arıza bildirmek istediklerinde, kuru bir form doldurmak yerine dijital bir bakım asistanı ("Usta Robot") tarafından karşılanır. Asistan adım adım:
  1. *"Merhaba! Lütfen adınızı ve soyadınızı girer misiniz?"*
  2. *"Harika. Problem hangi bölümde meydana geldi? Makine veya birimi seçer misiniz?"*
  3. *"Vardiyanızı şu anki saate göre otomatik belirledim, kontrol edebilir misiniz?"*
  4. *"Arıza türü nedir? Mekanik mi, Elektrik mi, Elektronik mi?"*
  5. *"Arızayı kısaca açıklar mısınız? Belirtiler nelerdir?"*
  6. *"Eklemek istediğiniz fotoğraf veya aciliyet durumu var mı?"*
  şeklinde kullanıcıyı yönlendirir.
- **Hedef Kitle**: Fabrika operatörleri, bakım teknisyenleri, vardiya amirleri ve saha personeli.
- **Temel Değer**: Arıza bildirim süresini kısaltmak, eksik ya da yanlış bilgi girişini (örneğin unutulan vardiya veya hatalı birim seçimi) sıfıra indirmek ve sahada keyifli, modern bir deneyim sunmak.

---

### 2. Kullanıcı Deneyimi ve Görsel Tasarım

#### Kullanıcı Akış Şeması
```
┌────────────────────────────────────────────────────────┐
│  Üst Menü: Logo | Arıza Listele | Vardiya Saat Rozeti │
├────────────────────────────────────────────────────────┤
│                                                        │
│   ┌────────────────┐   ┌───────────────────────────┐   │
│   │   3D Bakım     │   │ 💬 Asistan Balonu:        │   │
│   │   Asistanı     │   │ "Lütfen adınızı soyadınızı│   │
│   │   (Maskot)     │   │  yazar mısınız?"          │   │
│   └────────────────┘   └───────────────────────────┘   │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │ Aktif Adım Giriş Alanı:                        │   │
│   │ [ İsim Soyisim Input / Seçim Kartları ]        │   │
│   │                                                │   │
│   │ [ ← Geri ]                       [ Devam Et → ]│   │
│   └────────────────────────────────────────────────┘   │
│                                                        │
│   [● Ad / Soyad] ── [● Bölüm / Makine] ── [● Vardiya & Tür] ...
└────────────────────────────────────────────────────────┘
```

#### Görsel Kimlik ve Tema
- **Aesthetic Direction**: Endüstriyel temizlik, modern cam morfizim detayları, yüksek kontrastlı ve dokunmatik ekran dostu butonlar.
- **Renk Paleti**:
  - Arka Plan: Yumuşak endüstriyel gri-beyaz (`#F8FAFC`)
  - Kart ve Balon Yüzeyleri: Saf beyaz (`#FFFFFF`) ve hafif derinlik gölgeleri
  - Vurgu & Marka Rengi: Güven veren kurumsal kırmızı / kiremit (`#D93838` - AKG kimliği) ve tamamlayıcı endüstriyel lacivert/çelik tonları
  - Başarı & Tamamlanma: Zümrüt yeşili (`#16A34A`)
- **Tipografi**: `Plus Jakarta Sans` ve `DM Sans` eşleşmesi; okunabilirliği yüksek 16px taban font boyutu, net etiketler.
- **İnteraktif Geri Bildirimler**:
  - Asistanın konuşma balonunda yumuşak daktilo/fade-in efekti
  - Seçim yapıldığında otomatik bir sonraki adıma akıcı geçiş
  - Saate göre vardiyanın otomatik olarak tespit edilip yeşil bildirim ile teyit edilmesi
  - Form tamamlandığında asistanın kutlama/onay animasyonu

---

### 3. Kritik Ürün Kararları ve Tercihler

- **Karar 1: Maskot Konumu ve Boyutu**:
  - *Seçilen Yaklaşım*: Ekranın üst-orta veya sol tarafında dinamik boyutlanan, mobilde başlığın hemen altında duran samimi bir asistan maskotu.
  - *Gerekçe*: Mobilde ekranı kaplamadan konuşma balonu ile bir bütün oluşturması; fabrika ortamında aceleyle form giren teknisyeni yormaması.
- **Karar 2: Saate Göre Vardiya Otomasyonu**:
  - *Seçilen Yaklaşım*: `new Date().getHours()` kontrolü ile vardiya alanının sayfa açılır açılmaz doğru vardiyaya set edilmesi.
  - *Gerekçe*: Kullanıcıların %90'ı mevcut vardiyayı manuel seçmek zorunda kalmaz; hata payı düşer. Dilerse tek tıkla diğer vardiyayı seçebilir.
- **Karar 3: Mekanik / Elektrik / Diğer Hızlı Seçim Rozetleri**:
  - *Seçilen Yaklaşım*: Büyük, dokunmatik uyumlu ikonlu seçim kartları (Mekanik Bakım, Elektrik Bakım, Genel Arıza).
  - *Gerekçe*: Dropdown aramak yerine tek dokunuşla kategorize etme kolaylığı.

---

### 4. Teknik Mimari ve Veri Stratejisi

#### Sistem ve Bileşen Hiyerarşisi
```
┌─────────────────────────────────────────────────────────────────┐
│                          index.html                             │
├────────────────────────────────┬────────────────────────────────┤
│       Mascot & Dialog Hub      │        Form Engine             │
│  - Assistant Avatar (3D)       │  - Step 1: Ad Soyad           │
│  - Dynamic Speech Bubble       │  - Step 2: Bölüm & Makine      │
│  - Contextual Hints            │  - Step 3: Oto-Vardiya & Tür   │
│  - Audio / Visual Cues         │  - Step 4: Arıza Açıklaması    │
│                                │  - Step 5: Fotoğraf & Önizleme │
├────────────────────────────────┴────────────────────────────────┤
│                         app.js Mantığı                          │
│  - autoDetectShift(): Saate göre vardiya eşleştirme             │
│  - updateAssistantDialogue(stepIndex): Adıma özel konuşma metni │
│  - handleStepAdvance(): Validasyon ve otomatik ilerleme         │
│  - submitFaultReport(): Mevcut Google Apps Script / API entegr. │
│  - loadFaultBoard(): Açık Arızalar listesi (mevcut korundu)     │
└─────────────────────────────────────────────────────────────────┘
```

#### Otomatik Vardiya Algılama Mantığı
```javascript
function getAutoShift() {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 16) {
        return "1. Vardiya (08:00 - 16:00)";
    } else if (hour >= 16 && hour < 24) {
        return "2. Vardiya (16:00 - 24:00)";
    } else {
        return "3. Vardiya (24:00 - 08:00)";
    }
}
```

#### Korunacak Mevcut Özellikler
- **Açık Arızalar Listesi (Modal)**: Düzenlenen `Arıza Listele` butonu ve tam genişlikli tablo görünümü eksiksiz çalışmaya devam edecek.
- **Bölüm & Makine Dinamik Verileri**: Mevcut birim listeleri ve arama/seçim mekanizması korunacak.
- **Admin ve Dashboard Bağlantıları**: Üst menü ve ayarlar modalı tam işlevsel kalacak.

---

### 5. Uygulama Adımları (Onay Sonrası)

1. `generate_image` aracı ile yüksek kaliteli 3D Teknik Bakım Robot Asistanı görselini üretmek.
2. `index.html` içine asistan avatarı ve interaktif konuşma balonu yapısını yerleştirmek.
3. `app.js` içine saate göre otomatik vardiya belirleme (`autoDetectShift`) fonksiyonunu ve adıma göre değişen konuşma metinlerini eklemek.
4. Mekanik / Elektrik arıza türü seçimini görsel hızlı kartlar haline getirmek.
5. Görsel tasarımı ve mobil uyumluluğu test edip doğrulamak.
