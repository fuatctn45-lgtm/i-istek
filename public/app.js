// --- Haptic & Audio Feedback ---
window.audioCtx = null;
window.triggerFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(40);
    try {
        if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (window.audioCtx.state === 'suspended') window.audioCtx.resume();
        const osc = window.audioCtx.createOscillator();
        const gainNode = window.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, window.audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, window.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, window.audioCtx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, window.audioCtx.currentTime + 0.3);
        osc.connect(gainNode);
        gainNode.connect(window.audioCtx.destination);
        osc.start();
        osc.stop(window.audioCtx.currentTime + 0.35);
    } catch(e) {}
};
// Service Worker Registration for PWA (Android Install)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(console.error);
    });
}

// Ana sayfaya dÃ¶nÃ¼ldÃ¼ÄŸÃ¼nde admin yetkisini otomatik olarak sÄ±fÄ±rla (Ã‡Ä±kÄ±ÅŸ Yap)
sessionStorage.removeItem('isAdmin');

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEqLYUevIJCcLrJa-05MXx5ik-QFouq9o",
  authDomain: "arizabildirim-89dfa.firebaseapp.com",
  projectId: "arizabildirim-89dfa",
  storageBucket: "arizabildirim-89dfa.firebasestorage.app",
  messagingSenderId: "106785239667",
  appId: "1:106785239667:web:ab131b6a11d8133a537006"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// Ã‡evrimdÄ±ÅŸÄ± (Offline) DesteÄŸi
db.enablePersistence()
  .catch(function(err) {
      if (err.code == 'failed-precondition') {
          console.warn("Ã‡oklu sekme aÃ§Ä±k, offline mod tek sekmede Ã§alÄ±ÅŸÄ±r.");
      } else if (err.code == 'unimplemented') {
          console.warn("TarayÄ±cÄ± offline modu desteklemiyor.");
      }
  });
const storage = firebase.storage();

// Admin Panelinden AyarlarÄ± (Listeleri) Ã‡ekip Dropdown'larÄ± Doldur
const settingsRef = db.collection('ayarlar');
const dropdownMap = {
    'departments': 'costCenter',
    // 'machines': 'machine', -> Makineler artÄ±k bÃ¶lÃ¼me gÃ¶re dinamik gelecek
    'shifts': 'shift',
    'jobTypes': 'jobType'
};

// BaÄŸÄ±msÄ±z listeleri doldur
Object.keys(dropdownMap).forEach(cat => {
    settingsRef.doc(cat).onSnapshot(doc => {
        const selectEl = document.getElementById(dropdownMap[cat]);
        if (selectEl && doc.exists) {
            const list = doc.data().list || [];
            selectEl.innerHTML = '<option value="">SeÃ§iniz...</option>'; // Always reset first
            if (list.length > 0) {
                list.sort().forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item;
                    opt.textContent = item;
                    selectEl.appendChild(opt);
                });
            } else if (dropdownMap[cat] === 'shift') {
                ['1.VARDİYA 00:00 //08:00', '2.VARDİYA 08:00 //16:00', '3.VARDİYA 16:00 //24:00'].forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item;
                    opt.textContent = item;
                    selectEl.appendChild(opt);
                });
            } else if (dropdownMap[cat] === 'jobType') {
                ['MEKANİK ARIZA', 'ELEKTRİK ARIZA', 'PLANLI BAKIM KODU', 'İŞ GÜVENLİĞİ !!!', 'TEKRAR EDEN ARIZA   !!!!'].forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item;
                    opt.textContent = item;
                    selectEl.appendChild(opt);
                });
            }
            if (dropdownMap[cat] === 'shift' && window.applyAutoDetectedShift) {
                window.applyAutoDetectedShift();
            }
        }
    });
});

// Maliyet Merkezi -> Makine Dinamik Ä°liÅŸkisi
let currentMachineMap = {};
const costCenterSelect = document.getElementById('costCenter');
const machineSelect = document.getElementById('machine');

// EÅŸleÅŸtirme haritasÄ±nÄ± veritabanÄ±ndan dinle
settingsRef.doc('machineMap').onSnapshot(doc => {
    if (doc.exists) {
        currentMachineMap = doc.data();
    }
});

// BÃ¶lÃ¼m seÃ§ildiÄŸinde makineleri gÃ¼ncelle
costCenterSelect.addEventListener('change', (e) => {
    const selectedDept = e.target.value;
    machineSelect.innerHTML = '<option value="">Ã–nce BÃ¶lÃ¼m SeÃ§iniz...</option>';
    
    if (selectedDept && currentMachineMap[selectedDept]) {
        machineSelect.innerHTML = '<option value="">Makine SeÃ§iniz...</option>';
        const machList = currentMachineMap[selectedDept];
        machList.sort().forEach(mach => {
            const opt = document.createElement('option');
            opt.value = mach;
            opt.textContent = mach;
            machineSelect.appendChild(opt);
        });
    }
});

// İş Türü dropdown değiştiğinde hızlı butonları senkronize et
const jobTypeSelect = document.getElementById('jobType');
if (jobTypeSelect) {
    jobTypeSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (!val) return;
        const normalize = str => (str || '').replace(/[!\s]/g, '').toLowerCase("tr-TR");
        const valNorm = normalize(val);
        document.querySelectorAll('.job-quick-card').forEach(c => {
            const cardVal = c.dataset.jobType || c.innerText || '';
            const cNorm = normalize(cardVal);
            const isMatch = cNorm.includes(valNorm) || valNorm.includes(cNorm);
            c.classList.toggle('selected', isMatch);
        });
    });
}

// FotoÄŸraf SÄ±kÄ±ÅŸtÄ±rma Fonksiyonu (5MB dosyayÄ± 200KB'a dÃ¼ÅŸÃ¼rÃ¼r)
async function compressImage(file, maxWidth = 1024) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // %80 kalite ile JPEG olarak sÄ±kÄ±ÅŸtÄ±r
                canvas.toBlob(blob => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

const form = document.getElementById('faultForm');
const submitBtn = document.getElementById('submitBtn');

// Yeni Gönderim Modalı Elementleri
const submissionModal = document.getElementById('submissionModal');
const loadingState = document.getElementById('loadingState');
const successState = document.getElementById('successState');
const loadingSubText = document.getElementById('loadingSubText');
const closeCountdown = document.getElementById('closeCountdown');
let closeCountdownTimer = null;
let isFaultSubmitting = false;

window.submitFaultForm = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isFaultSubmitting) {
        console.warn("Is istegi zaten gonderiliyor; yinelenen gonderim engellendi.");
        return;
    }
    window.triggerFeedback();

    // 1. Tüm adımları doğrula
    for (let step = 1; step <= 6; step++) {
        if (!validateStep(step)) {
            window.closeSummaryOverlay();
            window.goToStep(step);
            return;
        }
    }

    // Dogrulama tamamlandi. Ikinci gonderimi engelle.
    isFaultSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;
    const overlaySubmitBtn = document.getElementById('submitBtnOverlay');
    if (overlaySubmitBtn) overlaySubmitBtn.disabled = true;

    // Özet ekranını kapat
    const overlay = document.getElementById('summaryOverlay');
    if (overlay) overlay.classList.add('hidden');

    // Yükleniyor ekranını aç
    if (submissionModal) submissionModal.classList.remove('hidden');
    if (loadingState) loadingState.classList.remove('hidden');
    if (successState) successState.classList.add('hidden');
    if (loadingSubText) loadingSubText.innerText = "Sistemle bağlantı kuruluyor...";

    try {
        // V6 Android optimizasyonu: once kaydi benzersiz belge kimligiyle olustur.
        // Fotograf yukleme, kaydin ekranda basarili gorunmesini bekletmez.
        const cameraFile = document.getElementById('cameraInput') ? document.getElementById('cameraInput').files[0] : null;
        const folderFile = document.getElementById('fileInput') ? document.getElementById('fileInput').files[0] : null;
        const photoFile = cameraFile || folderFile;

        if (loadingSubText) loadingSubText.innerText = "Talebiniz kaydediliyor...";

        const faultData = {
            userName: document.getElementById('userName').value,
            costCenter: document.getElementById('costCenter').value,
            machine: document.getElementById('machine').value,
            shift: document.getElementById('shift').value,
            jobType: document.getElementById('jobType').value,
            description: document.getElementById('description').value,
            photoUrl: "",
            photoUploadStatus: photoFile ? 'Bekliyor' : 'Yok',
            status: 'Açık',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            resolvedData: null
        };

        const faultRef = db.collection("arizalar").doc();
        const writePromise = faultRef.set(faultData);
        const writeResult = await Promise.race([
            writePromise.then(() => 'saved'),
            new Promise(resolve => setTimeout(() => resolve('queued'), 6500))
        ]);

        if (writeResult === 'queued' && loadingSubText) {
            loadingSubText.innerText = "Bağlantı yavaş. Talebiniz gönderim sırasına alındı.";
        }

        // Yazma islemi zaman asimina ugrasa bile ayni belge kimligi kullanilir;
        // yeniden kayit/ikiz is istegi olusmaz.
        writePromise.catch(error => {
            console.error("Arka plan kayıt hatası:", error);
        });

        if (photoFile) {
            (async () => {
                try {
                    await writePromise;
                    const compressedBlob = await compressImage(photoFile, 960);
                    const storageRef = storage.ref('ariza_fotolari/' + faultRef.id + '.jpg');
                    await storageRef.put(compressedBlob);
                    const photoUrl = await storageRef.getDownloadURL();
                    await faultRef.update({
                        photoUrl,
                        photoUploadStatus: 'Tamamlandı'
                    });
                } catch (photoError) {
                    console.error("Arka plan fotoğraf yükleme hatası:", photoError);
                    try {
                        await faultRef.set({ photoUploadStatus: 'Hata' }, { merge: true });
                    } catch (_) {}
                }
            })();
        }

        // Gönderim Başarılı -> Modal'ın 2. Aşamasını ANINDA Aç (Bekletme Yapmadan)
        if (loadingState) loadingState.classList.add('hidden');
        if (successState) successState.classList.remove('hidden');
        
        // Formu Arka Planda Sıfırla
        if (form) form.reset();
        window.resetStepper();
        
        // 10 Saniyelik Otomatik Kapatma Sayacı
        let secondsLeft = 10;
        if (closeCountdown) closeCountdown.innerText = secondsLeft;
        
        clearInterval(closeCountdownTimer);
        closeCountdownTimer = setInterval(() => {
            secondsLeft--;
            if (closeCountdown) closeCountdown.innerText = secondsLeft;
            if (secondsLeft <= 0) {
                clearInterval(closeCountdownTimer);
                window.closeSystem();
            }
        }, 1000);

        // Yeni Arıza Bildirimini Arka Planda (Kullanıcıyı Bekletmeden) Mail At
        (async () => {
            try {
                const mailDoc = await db.collection('ayarlar').doc('adminEmail').get();
                if (mailDoc.exists && mailDoc.data().key && mailDoc.data().faultMailEnabled !== false) {
                    const accessKey = mailDoc.data().key;
                    const dashboardLink = window.location.href.replace('index.html', '') + 'index.html';
                    const faultTypeStr = faultData.jobType ? faultData.jobType.toUpperCase() : "ARIZA BİLDİRİMİ";
                    const targetEmail = mailDoc.data().targetEmail || "";
                    
                    if (accessKey.startsWith("http")) {
                        fetch(accessKey, {
                            method: 'POST',
                            mode: 'no-cors',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({
                                type: 'fault',
                                targetEmail: targetEmail,
                                subject: faultData.machine || "Yeni Arıza",
                                from_name: faultTypeStr,
                                description: faultData.description,
                                userName: faultData.userName,
                                shift: faultData.shift,
                                link: dashboardLink
                            })
                        }).catch(e=>console.log(e));
                    } else {
                        fetch('https://api.web3forms.com/submit', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                            body: JSON.stringify({
                                access_key: accessKey,
                                subject: faultData.machine || "Yeni Arıza",
                                from_name: faultTypeStr,
                                message: faultData.description,
                                "Bildiren Personel": faultData.userName,
                                "Çalışılan Vardiya": faultData.shift,
                                "Sisteme Giriş Linki": dashboardLink
                            })
                        }).catch(e=>console.log(e));
                    }
                }
            } catch(e) { console.log("Mail gönderim arka plan hatası:", e); }
        })();

    } catch (error) {
        console.error("Hata: ", error);
        alert("Gönderim sırasında bir hata oluştu: " + error.message);
        if (submissionModal) submissionModal.classList.add('hidden');
        isFaultSubmitting = false;
        if (submitBtn) submitBtn.disabled = false;
        const overlaySubmitBtn = document.getElementById('submitBtnOverlay');
        if (overlaySubmitBtn) overlaySubmitBtn.disabled = false;
    }
};

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        window.submitFaultForm(e);
    });
}

// Modal Ä°Ã§i ButonlarÄ±n FonksiyonlarÄ±
window.startNewForm = () => {
    isFaultSubmitting = false;
    if (submitBtn) submitBtn.disabled = false;
    const overlaySubmitBtn = document.getElementById('submitBtnOverlay');
    if (overlaySubmitBtn) overlaySubmitBtn.disabled = false;
    clearInterval(closeCountdownTimer);
    submissionModal.classList.add('hidden');
    window.resetStepper();
};

window.closeSystem = () => {
    clearInterval(closeCountdownTimer);
    // Genellikle tarayÄ±cÄ±lar JS ile aÃ§Ä±lmayan pencereleri window.close() ile kapatmaya izin vermez.
    // Bu yÃ¼zden pencereyi kapatmayÄ± dener, olmazsa ekranÄ± tamamen siyaha Ã§evirir veya "Kapatabilirsiniz" mesajÄ± verir.
    document.body.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100vh; width:100vw; background:#000; color:#fff; flex-direction:column; font-family:sans-serif;"><h2 style="margin-bottom:1rem;">Sistem KapatÄ±ldÄ±</h2><p style="color:#aaa;">Bu sekmeyi gÃ¼venle kapatabilirsiniz.</p></div>';
    window.close(); 
};

// Doldurulan form alanlarÄ±nÄ±n (input, select, textarea) yanÄ±p sÃ¶nmesi iÃ§in dinleyici
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    const checkFilled = (el) => {
        if (el.value && el.value.trim() !== '') {
            el.classList.add('input-filled');
        } else {
            el.classList.remove('input-filled');
        }
    };

    inputs.forEach(el => {
        el.addEventListener('input', () => checkFilled(el));
        el.addEventListener('change', () => checkFilled(el));
        // Sayfa yÃ¼klendiÄŸinde mevcut dolularÄ± da kontrol et (Ã–rn: tarayÄ±cÄ± otomatik doldurduysa)
        checkFilled(el);
    });

    // AÃ§Ä±lÄ±r Listeler (Select) iÃ§in Otomatik Ä°lerleme (Auto-Advance)
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', (e) => {
            if (!e.target.value) return; // EÄŸer 'SeÃ§iniz' boÅŸ kalÄ±rsa iÅŸlem yapma
            
            const stepContainer = e.target.closest('.card-step');
            if (!stepContainer) return;
            
            const stepNum = parseInt(stepContainer.id.replace('step', ''));
            const stepInputs = Array.from(stepContainer.querySelectorAll('input:not([type="hidden"]), select, textarea'));
            const currentIndex = stepInputs.indexOf(e.target);
            
            if (currentIndex >= 0 && currentIndex < stepInputs.length - 1) {
                // AynÄ± adÄ±mda sÄ±radaki giriÅŸ alanÄ±na geÃ§ (Ã–rn: BÃ¶lÃ¼m seÃ§ilince Makine'ye odaklan)
                setTimeout(() => {
                    stepInputs[currentIndex + 1].focus();
                }, 100);
            } else {
                // Bu adÄ±mdaki son liste seÃ§ildi, doÄŸrudan bir sonraki adÄ±ma (merdivene) atla
                setTimeout(() => {
                    window.nextStep(stepNum);
                }, 250);
            }
        });
    });

    // FotoÄŸraf ModalÄ± ve SeÃ§im Ä°ÅŸlemleri
    const openPhotoModalBtn = document.getElementById('openPhotoModalBtn');
    const photoSelectionModal = document.getElementById('photoSelectionModal');
    const cameraInput = document.getElementById('cameraInput');
    const fileInput = document.getElementById('fileInput');
    const photoCompactText = document.getElementById('photoCompactText');

    if (openPhotoModalBtn && photoSelectionModal) {
        openPhotoModalBtn.addEventListener('click', () => {
            photoSelectionModal.classList.remove('hidden');
        });

        const handlePhotoSelection = (e, otherInput) => {
            if (e.target.files && e.target.files.length > 0) {
                // DiÄŸer input'u temizle (Ã§akÄ±ÅŸmayÄ± Ã¶nlemek iÃ§in)
                otherInput.value = "";
                
                const fileName = e.target.files[0].name;
                photoCompactText.innerText = "âœ… " + fileName;
                openPhotoModalBtn.style.background = "rgba(16, 185, 129, 0.1)";
                openPhotoModalBtn.style.borderColor = "var(--success)";
                openPhotoModalBtn.style.color = "var(--success)";
                
                // SeÃ§im yapÄ±ldÄ±ktan sonra modalÄ± kapat
                setTimeout(() => {
                    photoSelectionModal.classList.add('hidden');
                }, 300);
            }
        };

        if (cameraInput && fileInput) {
            cameraInput.addEventListener('change', (e) => handlePhotoSelection(e, fileInput));
            fileInput.addEventListener('change', (e) => handlePhotoSelection(e, cameraInput));
        }
    }
});
// ==========================================================================
// AKILLI BAKIM SİSTEM YARDIMCISI (USTA ROBOT) & DİNAMİK VARDİYA MANTIĞI
// ==========================================================================

window.getCalculatedShiftInfo = function() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    
    let shiftNum = 1;
    let shiftName = "1.VARDİYA 00:00 //08:00";
    if (hour >= 0 && hour < 8) {
        shiftNum = 1;
        shiftName = "1.VARDİYA 00:00 //08:00";
    } else if (hour >= 8 && hour < 16) {
        shiftNum = 2;
        shiftName = "2.VARDİYA 08:00 //16:00";
    } else {
        shiftNum = 3;
        shiftName = "3.VARDİYA 16:00 //24:00";
    }
    return { shiftNum, shiftName, timeStr };
};

window.applyAutoDetectedShift = function() {
    const shiftSelect = document.getElementById('shift');
    if (!shiftSelect) return;
    const { shiftNum, shiftName, timeStr } = window.getCalculatedShiftInfo();

    const bannerText = document.getElementById('autoShiftDetectedText');
    if (bannerText) {
        bannerText.innerHTML = `Şu anki saat <strong>${timeStr}</strong> · Tespit Edilen: <strong>${shiftName}</strong>`;
    }

    if (shiftSelect.options.length <= 1) {
        shiftSelect.innerHTML = `
            <option value="">Seçiniz...</option>
            <option value="1.VARDİYA 00:00 //08:00">1.VARDİYA 00:00 //08:00</option>
            <option value="2.VARDİYA 08:00 //16:00">2.VARDİYA 08:00 //16:00</option>
            <option value="3.VARDİYA 16:00 //24:00">3.VARDİYA 16:00 //24:00</option>
        `;
    }

    let foundIndex = -1;
    for (let i = 0; i < shiftSelect.options.length; i++) {
        const text = shiftSelect.options[i].text.toLowerCase("tr-TR");
        const val = shiftSelect.options[i].value.toLowerCase("tr-TR");
        if (
            (shiftNum === 1 && (text.includes('1.') || text.includes('00:00') || text.includes('//08:00') || text.includes('// 08:00') || val.includes('1.') || val.includes('00:00'))) ||
            (shiftNum === 2 && (text.includes('2.') || text.includes('08:00') || text.includes('//16:00') || text.includes('// 16:00') || val.includes('2.') || val.includes('08:00'))) ||
            (shiftNum === 3 && (text.includes('3.') || text.includes('16:00') || text.includes('//24:00') || text.includes('// 24:00') || text.includes('24:00') || val.includes('3.') || val.includes('16:00')))
        ) {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex >= 0) {
        shiftSelect.selectedIndex = foundIndex;
    }

    document.querySelectorAll('.shift-quick-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.shift) === shiftNum);
    });

    const shiftWrapper = shiftSelect.nextElementSibling;
    if (shiftWrapper && shiftWrapper.classList.contains('custom-select-wrapper')) {
        shiftWrapper.querySelectorAll('.custom-select-item').forEach(item => {
            const txt = item.innerText.toLowerCase("tr-TR");
            const isMatch = (shiftNum === 1 && (txt.includes('1.') || txt.includes('00:00') || txt.includes('//08:00') || txt.includes('// 08:00'))) ||
                            (shiftNum === 2 && (txt.includes('2.') || txt.includes('08:00') || txt.includes('//16:00') || txt.includes('// 16:00'))) ||
                            (shiftNum === 3 && (txt.includes('3.') || txt.includes('16:00') || txt.includes('//24:00') || txt.includes('// 24:00')));
            item.classList.toggle('selected', isMatch);
        });
    }
};

window.selectShiftPreset = function(num) {
    if (window.triggerFeedback) window.triggerFeedback();
    const shiftSelect = document.getElementById('shift');
    if (!shiftSelect) return;

    for (let i = 0; i < shiftSelect.options.length; i++) {
        const text = shiftSelect.options[i].text.toLowerCase("tr-TR");
        const val = shiftSelect.options[i].value.toLowerCase("tr-TR");
        if (
            (num === 1 && (text.includes('1.') || text.includes('00:00') || text.includes('//08:00') || text.includes('// 08:00') || val.includes('1.') || val.includes('00:00'))) ||
            (num === 2 && (text.includes('2.') || text.includes('08:00') || text.includes('//16:00') || text.includes('// 16:00') || val.includes('2.') || val.includes('08:00'))) ||
            (num === 3 && (text.includes('3.') || text.includes('16:00') || text.includes('//24:00') || text.includes('// 24:00') || text.includes('24:00') || val.includes('3.') || val.includes('16:00')))
        ) {
            shiftSelect.selectedIndex = i;
            shiftSelect.dispatchEvent(new Event('change'));
            break;
        }
    }

    document.querySelectorAll('.shift-quick-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.shift) === num);
    });

    const shiftWrapper = shiftSelect.nextElementSibling;
    if (shiftWrapper && shiftWrapper.classList.contains('custom-select-wrapper')) {
        shiftWrapper.querySelectorAll('.custom-select-item').forEach(item => {
            const txt = item.innerText.toLowerCase("tr-TR");
            const isMatch = (num === 1 && (txt.includes('1.') || txt.includes('00:00') || txt.includes('//08:00') || txt.includes('// 08:00'))) ||
                            (num === 2 && (txt.includes('2.') || txt.includes('08:00') || txt.includes('//16:00') || txt.includes('// 16:00'))) ||
                            (num === 3 && (txt.includes('3.') || txt.includes('16:00') || txt.includes('//24:00') || txt.includes('// 24:00')));
            item.classList.toggle('selected', isMatch);
        });
    }

    window.animateAssistantReaction(`${num}. Vardiya seçildi! 👍`);
    setTimeout(() => {
        window.nextStep(4);
    }, 280);
};

window.selectJobTypePreset = function(typeKeyword) {
    if (window.triggerFeedback) window.triggerFeedback();
    const jtSelect = document.getElementById('jobType');
    if (!jtSelect) return;

    const normalize = str => (str || '').replace(/[!\s]/g, '').toLowerCase("tr-TR");
    const targetNorm = normalize(typeKeyword);

    let matched = false;
    for (let i = 0; i < jtSelect.options.length; i++) {
        const optValNorm = normalize(jtSelect.options[i].value);
        const optTextNorm = normalize(jtSelect.options[i].text);
        if (optValNorm === targetNorm || optTextNorm === targetNorm || optValNorm.includes(targetNorm) || optTextNorm.includes(targetNorm)) {
            jtSelect.selectedIndex = i;
            jtSelect.value = jtSelect.options[i].value;
            jtSelect.dispatchEvent(new Event('change'));
            matched = true;
            break;
        }
    }

    if (!matched) {
        const opt = document.createElement('option');
        opt.value = typeKeyword;
        opt.textContent = typeKeyword;
        opt.selected = true;
        jtSelect.appendChild(opt);
        jtSelect.value = opt.value;
        jtSelect.dispatchEvent(new Event('change'));
    }

    // Hızlı seçim kartlarının aktiflik durumunu güncelle
    document.querySelectorAll('.job-quick-card').forEach(c => {
        const cardVal = c.dataset.jobType || c.innerText || '';
        const cNorm = normalize(cardVal);
        const isMatch = cNorm.includes(targetNorm) || targetNorm.includes(cNorm);
        c.classList.toggle('selected', isMatch);
    });

    const jtWrapper = jtSelect.nextElementSibling;
    if (jtWrapper && jtWrapper.classList.contains('custom-select-wrapper')) {
        jtWrapper.querySelectorAll('.custom-select-item').forEach(item => {
            const txt = normalize(item.innerText);
            item.classList.toggle('selected', txt.includes(targetNorm) || targetNorm.includes(txt));
        });
    }

    window.animateAssistantReaction(`${typeKeyword} seçildi! ⚙️`);
    setTimeout(() => {
        window.nextStep(5);
    }, 280);
};

window.assistantDialogues = {
    1: {
        tag: "Adım 01/06 · Kimlik",
        text: () => "Merhaba! 👋 Ben bakım sistemi yardımcı asistanınızım. Lütfen adınızı ve soyadınızı girer misiniz?",
        hint: ""
    },
    2: {
        tag: "Adım 02/06 · Bölüm",
        text: () => {
            const name = document.getElementById('userName')?.value.trim();
            const first = name ? name.split(' ')[0] : '';
            return first 
                ? `Teşekkürler ${first}! Problem fabrikanın hangi bölümünde? Bölüm veya biriminizi seçer misiniz?`
                : "Problem fabrikanın hangi bölümünde meydana geldi? Bölüm veya departmanınızı seçer misiniz?";
        },
        hint: "Bölüm seçimi yapıldığında o bölüme ait makineler listelenecektir."
    },
    3: {
        tag: "Adım 03/06 · Makine",
        text: () => {
            const cc = document.getElementById('costCenter');
            let ccText = (cc && cc.selectedIndex >= 0 && cc.value) ? cc.options[cc.selectedIndex].text.replace(/^[0-9]+-[0-9]+-/, '') : '';
            return ccText 
                ? `Harika, ${ccText} bölümü seçildi. Peki problem hangi makinede veya birimde? Makinenizi seçer misiniz?`
                : "Arızalı veya bakım isteyen makine veya birimi seçer misiniz?";
        },
        hint: "Tesis bünyesinde tanımlı aktif makine envanteri arasından seçim yapabilirsiniz."
    },
    4: {
        tag: "Adım 04/06 · Vardiya",
        text: () => {
            const shiftInfo = window.getCalculatedShiftInfo();
            return `Çalışma saatine göre (${shiftInfo.timeStr}) vardiyanızı otomatik olarak ${shiftInfo.shiftName} olarak belirledim. Kontrol edebilir veya değiştirebilirsiniz.`;
        },
        hint: "Zamanında müdahale planlaması ve teknisyen yönlendirmesi için vardiya saati otomatik seçilir."
    },
    5: {
        tag: "Adım 05/06 · İş Türü",
        text: () => "Arıza veya iş türünü hızlı butonlardan veya listeden seçer misiniz?",
        hint: "Sistem filtreleriyle tam uyumlu: MEKANİK ARIZA, ELEKTRİK ARIZA, PLANLI BAKIM KODU vb."
    },
    6: {
        tag: "Adım 06/06 · Açıklama",
        text: () => "Neredeyse tamamladık! Arızayı veya talebinizi kısaca açıklar mısınız? Sorun nasıl başladı?",
        hint: "Belirtiler, sesler veya parçalar hakkında detay vermeniz bakım ekibinin daha hızlı çözüm üretmesini sağlar."
    },
    7: {
        tag: "Özet ve Onay",
        text: () => "Harika bir bildirim hazırladınız! Bilgilerinizi kontrol edip 'Bakım Talebini İlet' butonuna basabilirsiniz.",
        hint: "Kayıt anında açık arıza panosuna düşecek ve bakım ekibine iletilecektir."
    }
};

window.updateAssistantStep = function(stepNum) {
    const dialogue = window.assistantDialogues[stepNum] || window.assistantDialogues[1];
    const bubbleText = document.getElementById('assistantBubbleText');
    const stepTag = document.getElementById('asstStepTag');
    const hintText = document.getElementById('assistantHintText');
    const hintContainer = document.getElementById('assistantHint');
    const bubble = document.getElementById('assistantBubble');
    const mascot = document.getElementById('mascotRobot');

    if (stepTag) stepTag.innerText = dialogue.tag;
    if (hintContainer) {
        hintContainer.style.display = 'none';
    }

    if (bubbleText) {
        bubbleText.style.opacity = '0';
        setTimeout(() => {
            bubbleText.innerText = typeof dialogue.text === 'function' ? dialogue.text() : dialogue.text;
            bubbleText.style.opacity = '1';
        }, 120);
    }

    if (bubble) {
        bubble.style.borderColor = '#d93838';
        setTimeout(() => {
            bubble.style.borderColor = '#e2e8f0';
        }, 400);
    }

    if (mascot) {
        mascot.classList.add('mascot-nod');
        setTimeout(() => mascot.classList.remove('mascot-nod'), 600);
    }

    if (stepNum === 4) {
        window.applyAutoDetectedShift();
    }
};

window.animateAssistantReaction = function(notice) {
    const bubbleText = document.getElementById('assistantBubbleText');
    const mascot = document.getElementById('mascotRobot');
    if (bubbleText && notice) {
        bubbleText.style.opacity = '0';
        setTimeout(() => {
            bubbleText.innerText = notice;
            bubbleText.style.opacity = '1';
        }, 100);
    }
    if (mascot) {
        mascot.classList.add('mascot-nod');
        setTimeout(() => mascot.classList.remove('mascot-nod'), 600);
    }
};

// --- Çok Adımlı Form (Stepper) Mantığı ---

window.goToStep = (step) => {
    const currentActiveCard = document.querySelector('.card-step.active');
    const currentActiveNav = document.querySelector('.step-item.active');
    
    // Ãœst menÃ¼yÃ¼ gizle/gÃ¶ster ve adÄ±mlarÄ± yukarÄ± kaydÄ±r
    const topMenu = document.querySelector('.glass-top-menu');
    const stepperWrapper = document.querySelector('.stepper-wrapper');
    if (topMenu) {
        if (step > 1) {
            topMenu.classList.add('hidden-up');
            if (stepperWrapper) stepperWrapper.classList.add('stepper-up');
        } else {
            topMenu.classList.remove('hidden-up');
            if (stepperWrapper) stepperWrapper.classList.remove('stepper-up');
        }
    }
    
    if (currentActiveCard) {
        const currentStepNum = parseInt(currentActiveCard.id.replace('step', ''));
        if (currentStepNum === step) return;
        
        // Sadece ileri gidiyorsa doÄŸrula
        if (step > currentStepNum) {
            if (!validateStep(currentStepNum)) return;
            // Aradaki adÄ±mlarÄ± da doÄŸrula (atlama durumunda)
            for(let i = currentStepNum + 1; i < step; i++){
                if (!validateStep(i)) return; // Ã–nceki adÄ±m hatalÄ±ysa ileri atlayamaz
            }
        }
        
        currentActiveCard.classList.remove('active');
        if(currentActiveNav) currentActiveNav.classList.remove('active');
    }
    
    const targetCard = document.getElementById(`step${step}`);
    const targetNav = document.getElementById('nav-step' + step);
    
    if(targetCard && targetNav) {
        targetCard.classList.add('active');
        targetNav.classList.add('active');
        
        targetNav.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        if (window.updateAssistantStep) window.updateAssistantStep(step);
        

        
        const firstInput = targetCard.querySelector('input, select, textarea');
        if(firstInput && !firstInput.dataset.customized) setTimeout(() => firstInput.focus(), 300);
    }
};

window.nextStep = (currentStepNum) => {
    window.triggerFeedback();
    if (validateStep(currentStepNum)) {
        if (currentStepNum === 6) {
            window.showSummaryOverlay();
        } else {
            goToStep(currentStepNum + 1);
        }
    }
};

window.showSummaryOverlay = () => {
    if (window.updateAssistantStep) window.updateAssistantStep(7);
    document.getElementById('sum-name').innerText = document.getElementById('userName').value || '-';
    const cc = document.getElementById('costCenter');
    let ccText = (cc && cc.selectedIndex >= 0) ? cc.options[cc.selectedIndex].text : '-';
    // Remove prefix for summary display
    ccText = ccText.replace(/^[0-9]+-[0-9]+-/, '');
    document.getElementById('sum-dept').innerText = ccText;
    const mach = document.getElementById('machine');
    document.getElementById('sum-mach').innerText = (mach && mach.selectedIndex >= 0) ? mach.options[mach.selectedIndex].text : '-';
    const sh = document.getElementById('shift');
    document.getElementById('sum-shift').innerText = (sh && sh.selectedIndex >= 0) ? sh.options[sh.selectedIndex].text : '-';
    const jt = document.getElementById('jobType');
    const overlay = document.getElementById('summaryOverlay');
    const tIcons = overlay.querySelectorAll('.t-icon');
    
    if (jt && jt.selectedIndex >= 0) {
        const jobText = jt.options[jt.selectedIndex].text;
        document.getElementById('sum-job').innerText = jobText;
        
        const checkText = jobText.toUpperCase();
        document.getElementById('sum-job').innerHTML = window.getJobTypeHTML(jobText);
        
        if (/İSG|İSG|GÃœVEN|GUVEN|Ä°Å GÃœVENLÄ°ÄÄ°/i.test(jobText)) {
            overlay.classList.add('is-isg');
            overlay.classList.remove('is-normal');
        } else {
            overlay.classList.remove('is-isg');
            overlay.classList.add('is-normal');
        }
        
        // Sadece yazÄ± deÄŸerlerinin (t-val) arka planlarÄ±nÄ± iÅŸ tÃ¼rÃ¼ rengine boyama (kÃ¶ÅŸesiz)
        const rowBg = window.getRowBgColor(jobText);
        const timelineItems = overlay.querySelectorAll('.timeline-item');
        
        if (rowBg !== 'transparent') {
            const rowTextColor = (rowBg === '#FF00FF' || rowBg === '#FF0000') ? '#FFFFFF' : '#000000';
            timelineItems.forEach(item => {
                // Konteyneri temizle
                item.style.backgroundColor = '';
                item.style.color = '';
                item.style.padding = '';
                item.style.marginBottom = '';
                
                const svg = item.querySelector('svg');
                if (svg) svg.style.color = '';
                
                const tTitle = item.querySelector('.t-title');
                if (tTitle) tTitle.style.color = '';
                
                // Sadece metinlerin (deÄŸerlerin) arka planÄ±nÄ± boya
                const tVal = item.querySelector('.t-val');
                if (tVal) {
                    tVal.style.backgroundColor = rowBg;
                    tVal.style.color = rowTextColor;
                    tVal.style.borderRadius = '0';
                    tVal.style.padding = '2px 8px';
                    tVal.style.display = 'inline-block';
                    tVal.style.fontWeight = 'bold';
                }
            });
        } else {
            timelineItems.forEach(item => {
                item.style.backgroundColor = '';
                item.style.color = '';
                item.style.padding = '';
                item.style.marginBottom = '';
                
                const svg = item.querySelector('svg');
                if (svg) svg.style.color = '';
                
                const tTitle = item.querySelector('.t-title');
                if (tTitle) tTitle.style.color = '';
                
                const tVal = item.querySelector('.t-val');
                if (tVal) {
                    tVal.style.backgroundColor = '';
                    tVal.style.color = '';
                    tVal.style.borderRadius = '';
                    tVal.style.padding = '';
                    tVal.style.display = '';
                    tVal.style.fontWeight = '';
                }
            });
        }
    } else {
        document.getElementById('sum-job').innerText = '-';
        overlay.classList.remove('is-isg');
        overlay.classList.add('is-normal');
        
        const timelineItems = overlay.querySelectorAll('.timeline-item');
        timelineItems.forEach(item => {
            item.style.backgroundColor = '';
            item.style.color = '';
            item.style.padding = '';
            item.style.marginBottom = '';
            const svg = item.querySelector('svg');
            if (svg) svg.style.color = '';
            const tTitle = item.querySelector('.t-title');
            if (tTitle) tTitle.style.color = '';
            const tVal = item.querySelector('.t-val');
            if (tVal) {
                tVal.style.backgroundColor = '';
                tVal.style.color = '';
                tVal.style.borderRadius = '';
                tVal.style.padding = '';
                tVal.style.display = '';
                tVal.style.fontWeight = '';
            }
        });
    }
    document.getElementById('sum-desc').innerText = document.getElementById('description').value || '-';
    
    document.getElementById('summaryOverlay').classList.remove('hidden');
};

window.closeSummaryOverlay = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    window.triggerFeedback();
    const overlay = document.getElementById('summaryOverlay');
    if (overlay) overlay.classList.add('hidden');
    if (window.updateAssistantStep) window.updateAssistantStep(6);
};

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('submitBtnOverlay');
    if(btn) {
        btn.addEventListener('click', (e) => {
            if (e && e.preventDefault) e.preventDefault();
            window.submitFaultForm(e);
        });
    }

    // Auto-detect shift and initialize assistant on load
    setTimeout(() => {
        if (window.applyAutoDetectedShift) window.applyAutoDetectedShift();
        if (window.updateAssistantStep) window.updateAssistantStep(1);
    }, 200);

    const mascot = document.getElementById('mascotRobot');
    if (mascot) {
        mascot.addEventListener('click', () => {
            if (window.animateAssistantReaction) {
                window.animateAssistantReaction("Size yardımcı olmaktan mutluluk duyuyorum! 🤖🔧");
            }
        });
    }

    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.addEventListener('input', () => {
            const currentActiveCard = document.querySelector('.card-step.active');
            if (currentActiveCard && currentActiveCard.id === 'step1') {
                const name = userNameEl.value.trim();
                const bubble = document.getElementById('assistantBubbleText');
                if (bubble && name.length >= 2) {
                    bubble.innerText = `Harika, ${name}! 'İleri' butonuna basarak devam edebilirsiniz.`;
                }
            }
        });
        userNameEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.nextStep(1);
            }
        });
    }
});

const validateStep = (step) => {
    const container = document.getElementById('step' + step);
    if (!container) return true;
    
    const inputs = container.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(el => {
        let targetEl = el;
        if (el.dataset.customized) {
            const wrapper = el.nextElementSibling;
            if (wrapper && wrapper.classList.contains('custom-select-wrapper')) {
                targetEl = wrapper.querySelector('input');
            }
        }
        
        if (!el.value.trim()) {
            if(targetEl) {
                targetEl.style.borderColor = 'var(--danger)';
                targetEl.classList.add('shake');
                setTimeout(() => targetEl.classList.remove('shake'), 500);
            }
            isValid = false;
        } else {
            if(targetEl) targetEl.style.borderColor = ''; 
        }
    });
    return isValid;
};

// Form submit baÅŸarÄ±lÄ± olduÄŸunda veya gÃ¼Ã§ butonuna basÄ±ldÄ±ÄŸÄ±nda ilk adÄ±ma dÃ¶ndÃ¼r
window.resetStepper = () => {
    const overlay = document.getElementById('summaryOverlay');
    if(overlay) overlay.classList.add('hidden');
    document.querySelectorAll('.card-step').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-item').forEach(el => el.classList.remove('active'));
    
    // Ãœst menÃ¼yÃ¼ ve adÄ±mlarÄ± geri getir
    const topMenu = document.querySelector('.glass-top-menu');
    const stepperWrapper = document.querySelector('.stepper-wrapper');
    if (topMenu) topMenu.classList.remove('hidden-up');
    if (stepperWrapper) stepperWrapper.classList.remove('stepper-up');
    
    document.getElementById('step1').classList.add('active');
    document.getElementById('nav-step1').classList.add('active');
    
    document.getElementById('nav-step1').scrollIntoView({ behavior: 'smooth', inline: 'center' });
    
    // FotoÄŸraf Butonunu ve SeÃ§imlerini SÄ±fÄ±rla
    const openPhotoModalBtn = document.getElementById('openPhotoModalBtn');
    if (openPhotoModalBtn) {
        document.getElementById('photoCompactText').innerText = "FotoÄŸraf Ekle (Opsiyonel)";
        openPhotoModalBtn.style.color = "var(--text-secondary)";
        openPhotoModalBtn.style.background = "transparent";
        openPhotoModalBtn.style.borderColor = "var(--input-border)";
        
        const cameraInput = document.getElementById('cameraInput');
        const fileInput = document.getElementById('fileInput');
        if(cameraInput) cameraInput.value = "";
        if(fileInput) fileInput.value = "";
    }
    
    // Formu temizle
    document.getElementById('faultForm').reset();
};

window.adminLogin = async () => {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('adminPasswordInput').value = '';
        setTimeout(() => document.getElementById('adminPasswordInput').focus(), 100);
    }
};

window.closeAdminLogin = () => {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.add('hidden');
};

window.submitAdminModalLogin = () => {
    const passInput = document.getElementById('adminPasswordInput');
    if (passInput.value === "12345") { 
        sessionStorage.setItem("isAdmin", "true");
        
        // Admin GiriÅŸ YaptÄ±ÄŸÄ±nda Mail GÃ¶nderimi (Bekletmeden arka planda)
        db.collection('ayarlar').doc('adminEmail').get().then(mailDoc => {
            if (mailDoc.exists && mailDoc.data().key && mailDoc.data().loginMailEnabled !== false) {
                const accessKey = mailDoc.data().key;
                const targetEmail = mailDoc.data().targetEmail || "";
                
                if(accessKey.startsWith("http")) {
                    fetch(accessKey, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({
                            type: 'login',
                            targetEmail: targetEmail,
                            subject: "âš ï¸ Admin GiriÅŸi",
                            description: `Sisteminize an itibariyle ÅŸifre ile baÅŸarÄ±lÄ± bir Admin giriÅŸi yapÄ±lmÄ±ÅŸtÄ±r.\nTarih: ${new Date().toLocaleString('tr-TR')}`
                        })
                    }).catch(e=>console.log(e));
                } else {
                    fetch('https://api.web3forms.com/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({
                            access_key: accessKey,
                            subject: "âš ï¸ SÄ°STEM GÃœVENLÄ°ÄÄ°: Ana Sayfadan Admin Paneline GiriÅŸ YapÄ±ldÄ±",
                            from_name: "BakÄ±m Sistemi",
                            email: "sistem@bildirim.com",
                            message: `Sisteminize (Ana Sayfa Ã¼zerinden) ÅŸifre ile baÅŸarÄ±lÄ± bir Admin giriÅŸi yapÄ±lmÄ±ÅŸtÄ±r.\nTarih: ${new Date().toLocaleString('tr-TR')}`
                        })
                    }).catch(e=>console.log(e));
                }
            }
        }).catch(e => console.log("Mail gÃ¶nderilemedi."));

        window.location.href = "admin.html";
    } else {
        alert("HatalÄ± ÅŸifre!");
        passInput.value = "";
        passInput.focus();
    }
};

// GÃ¶nder Butonu GÃ¶rÃ¼nÃ¼rlÃ¼k ve Neon KontrolÃ¼
const descriptionInput = document.getElementById('description');
const submitNeonBtn = document.getElementById('submitBtn');
const navCenterWrap = document.querySelector('.nav-center-wrap');

if (descriptionInput) {
    descriptionInput.addEventListener('input', function() {
        if (this.value.trim().length > 3) {
            if(submitNeonBtn) submitNeonBtn.classList.add('ready-to-submit');
            if(navCenterWrap) navCenterWrap.classList.add('show-btn');
        } else {
            if(submitNeonBtn) submitNeonBtn.classList.remove('ready-to-submit');
            if(navCenterWrap) navCenterWrap.classList.remove('show-btn');
        }
    });
}

// --- OTOMATÄ°K GOOGLE SHEETS SENKRONÄ°ZASYONU ---
// GÃ¼nde 1 kez ilk giren kiÅŸi Ã¼zerinden listeleri gÃ¼nceller
async function autoSyncGoogleSheet() {
    try {
        const todayStr = new Date().toLocaleDateString('tr-TR'); // Ã–rn: 12.06.2026
        const syncRef = db.collection('ayarlar').doc('lastSync');
        const doc = await syncRef.get();
        
        if (doc.exists && doc.data().date === todayStr) {
            return; // BugÃ¼n zaten gÃ¼ncellenmiÅŸ
        }

        // AynÄ± anda birden fazla cihazÄ±n gÃ¼ncellemesini Ã¶nlemek iÃ§in tarihi hemen yazalÄ±m
        await syncRef.set({ date: todayStr, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        
        console.log("Google Sheets otomatik senkronizasyon baÅŸlatÄ±lÄ±yor...");
        
                // YENÄ°: JSONP ile Google GViz API Ã¼zerinden doÄŸrudan veri Ã§ekme (Proxysiz, CORS engeli yok)
        const fetchGVizJSONP = (url) => new Promise((resolve, reject) => {
            const cb = 'gviz_' + Math.round(Math.random() * 1000000);
            window[cb] = (data) => {
                delete window[cb];
                document.body.removeChild(script);
                resolve(data);
            };
            const script = document.createElement('script');
            script.src = url.replace('tqx=out:json', 'tqx=out:json;responseHandler:' + cb);
            script.onerror = () => reject(new Error('JSONP baÅŸarisiz'));
            document.body.appendChild(script);
        });

        const sheetUrl = "https://docs.google.com/spreadsheets/d/1n4FONdt1lCVZ9MwNzkw3O3ljs97nWVshz6Ke6Sn7_zY/gviz/tq?tqx=out:json&gid=1434126787";
        const data = await fetchGVizJSONP(sheetUrl);
        
        const sheetUrl2 = "https://docs.google.com/spreadsheets/d/17SimRKvaSCkCSTQcW8rQzn-xgJX9lpYE0t6FME_qANA/gviz/tq?tqx=out:json&gid=149476655";
        let data2 = null;
        try {
            data2 = await fetchGVizJSONP(sheetUrl2);
        } catch(err) {
            console.warn("2. tablo alinamadi: ", err);
        }

        if (!data || !data.table || !data.table.rows) throw new Error("Veri alinamadi.");

        const departments = new Set();
        const machines = new Set();
        const machineMap = {};
        
        const jobTypes = new Set();
        const shifts = new Set();

        const rawRows = data.table.rows;
        const rows = [];
        for(let r of rawRows) {
            if(r.c) rows.push(r.c);
        }

        for (let i = 0; i < rows.length; i++) {
            let cols = rows[i];
            if (cols.length >= 3) {
                let dept = cols[1] && cols[1].v ? String(cols[1].v).trim().replace(/\n/g, ' ') : '';
                let mach = cols[2] && cols[2].v ? String(cols[2].v).trim().replace(/\n/g, ' ') : '';
                
                if (dept && dept !== 'MALÄ°YET MERKEZÄ°' && !dept.includes("37")) {
                    dept = dept.toUpperCase();
                    departments.add(dept);
                    
                    if (mach && mach !== 'MAKÄ°NE ADI' && !mach.includes("37")) {
                        mach = mach.toUpperCase();
                        machines.add(mach);
                        
                        if (!machineMap[dept]) machineMap[dept] = new Set();
                        machineMap[dept].add(mach);
                    }
                }
            }
        }

        const deptArray = Array.from(departments);
        const machArray = Array.from(machines);
        const finalMap = {};
        Object.keys(machineMap).forEach(k => { finalMap[k] = Array.from(machineMap[k]); });

        if (data2 && data2.table && data2.table.rows) {
            for (let r of data2.table.rows) {
                if (r.c) {
                    let jt = r.c[6] && r.c[6].v ? String(r.c[6].v).trim().replace(/\n/g, ' ') : '';
                    if (jt && jt !== 'Ä°Å Ä°STEK TÃœRÃœ') jobTypes.add(jt.toUpperCase());
                    
                    let sh = r.c[7] && r.c[7].v ? String(r.c[7].v).trim().replace(/\n/g, ' ') : '';
                    if (sh && sh !== 'VARDÄ°YA' && sh !== 'VARDIYA') shifts.add(sh.toUpperCase());
                }
            }
        }

        const jobTypeArray = Array.from(jobTypes);
        const shiftArray = Array.from(shifts);

        if (deptArray.length > 0) await db.collection('ayarlar').doc('departments').set({ list: deptArray });
        if (machArray.length > 0) await db.collection('ayarlar').doc('machines').set({ list: machArray });
        if (Object.keys(finalMap).length > 0) await db.collection('ayarlar').doc('machineMap').set(finalMap);
        if (jobTypeArray.length > 0) await db.collection('ayarlar').doc('jobTypes').set({ list: jobTypeArray });
        if (shiftArray.length > 0) await db.collection('ayarlar').doc('shifts').set({ list: shiftArray });
        
        console.log("Google Sheets otomatik senkronizasyon tamamlandı.");
    } catch (err) {
        console.error("Otomatik senkronizasyon başarısız:", err);
    }
}

// Uygulama açıldığında otomatik senkronizasyonu tetikle
setTimeout(() => {
    autoSyncGoogleSheet();
}, 1000);






window.getJobTypeHTML = (jobType) => {
    if (!jobType || jobType === '-') return '-';
    let bg = '#e2e8f0';
    let color = '#4a5568';
    const text = jobType.toUpperCase();
    
    if (text.includes('MEKANİK') || text.includes('MEKANİK')) { bg = '#00FFFF'; color = '#000000'; }
    else if (text.includes('ELEKTRİK') || text.includes('ELEKTRİK')) { bg = '#FFFF00'; color = '#000000'; }
    else if (text.includes('PLANLI')) { bg = '#FFA500'; color = '#000000'; }
    else if (text.includes('TEKRAR')) { bg = '#FF00FF'; color = '#FFFFFF'; }
    else if (text.includes('isg') || text.includes('İSG') || text.includes('GÜVENLİĞİ')) { bg = '#FF0000'; color = '#FFFFFF'; }
    else if (text.includes('ARIZA')) { bg = '#fee2e2'; color = '#991b1b'; } // Varsayılan arıza
    else if (text.includes('PERİYODİK') || text.includes('PERIYODIK')) { bg = '#dbeafe'; color = '#1e40af'; }
    else if (text.includes('KESTİRİMCİ') || text.includes('KESTIRIMCI')) { bg = '#f3e8ff'; color = '#6b21a8'; }
    else if (text.includes('İYİLEŞTİRME') || text.includes('IYILESTIRME')) { bg = '#dcfce7'; color = '#166534'; }

    return `<span style="background-color: ${bg}; color: ${color}; padding: 2px 6px; border-radius: 0px; font-size: 0.85em; font-weight: 600; display: inline-block; white-space: nowrap;">${jobType}</span>`;
};

window.getRowBgColor = (jobType) => {
    if (!jobType) return 'transparent';
    const text = jobType.toUpperCase();
    if (text.includes('MEKANİK') || text.includes('MEKANİK')) return '#00FFFF';
    if (text.includes('ELEKTRİK') || text.includes('ELEKTRİK')) return '#FFFF00';
    if (text.includes('PLANLI')) return '#FFA500';
    if (text.includes('TEKRAR')) return '#FF00FF';
    if (text.includes('İSG') || text.includes('İSG') || text.includes('GÜVENLİĞİ')) return '#FF0000';
    return 'transparent';
};

// --- Custom Select Searchable List ---
function makeSelectSearchable(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.dataset.customized) return;
    select.dataset.customized = "true";
    
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    const list = document.createElement('div');
    list.className = 'custom-select-list';
    
    
    wrapper.appendChild(list);
    
    select.parentNode.insertBefore(wrapper, select.nextSibling);
    select.style.display = 'none';
    
    const render = (filter = '') => {
        list.innerHTML = '';
        const searchVal = filter.toLowerCase("tr-TR");
        Array.from(select.options).forEach(opt => {
            if (opt.value === '') return;
            if (opt.text.toLowerCase("tr-TR").includes(searchVal)) {
                const item = document.createElement('div');
                item.className = 'custom-select-item';
                if(select.value === opt.value) item.classList.add('selected');
                
                let displayText = opt.text;
                if (selectId === 'costCenter') {
                    displayText = displayText.replace(/^[0-9]+-[0-9]+-/, '');
                }
                
                if (selectId === 'jobType') {
                    const rowBg = window.getRowBgColor(opt.text);
                    item.innerText = displayText;
                    if (rowBg !== 'transparent') {
                        item.style.backgroundColor = rowBg;
                        item.style.color = (rowBg === '#FF00FF' || rowBg === '#FF0000') ? '#FFFFFF' : '#000000';
                        item.style.fontWeight = 'bold';
                        item.style.borderBottom = '1px solid rgba(0,0,0,0.1)';
                        item.style.borderRadius = '0';
                    }
                } else {
                    item.innerText = displayText;
                }
                
                item.onclick = () => {
                    window.triggerFeedback();
                    select.value = opt.value;
                    select.dispatchEvent(new Event('change'));
                    list.querySelectorAll('.custom-select-item').forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');
                    
                    const stepEl = select.closest('.card-step');
                    if(stepEl) {
                        const currentStep = parseInt(stepEl.id.replace('step', ''));
                        setTimeout(() => window.nextStep(currentStep), 200);
                    }
                };
                list.appendChild(item);
            }
        });
    };
    
    
    
    const observer = new MutationObserver(() => render());
    observer.observe(select, { childList: true });
    
    render();
}

setTimeout(() => {
    ['costCenter', 'machine'].forEach(id => makeSelectSearchable(id));
}, 500);

















// --- SIDE MENU LOGIC ---
window.toggleMenu = () => {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    if (!menu || !overlay) return;
    
    menu.classList.toggle('open');
    if (menu.classList.contains('open')) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
};

window.menuAction = (action) => {
    if (action === 'home') {
        window.resetStepper();
    } else if (action === 'admin') {
        // adminModal is actually adminLoginModal in index.html
        const adminModal = document.getElementById('adminLoginModal');
        if (adminModal) {
            adminModal.classList.remove('hidden');
            setTimeout(() => document.getElementById('adminPasswordInput').focus(), 100);
        }
    } else if (action === 'board') {
        const boardModal = document.getElementById('faultBoardModal');
        if (boardModal) {
            boardModal.classList.remove('hidden');
            loadFaultBoard();
        }
    } else if (action === 'sendMessage') {
        // Eski mesaj butonu (artÄ±k kullanÄ±lmÄ±yor ama uyumluluk iÃ§in kalabilir)
        const msgModal = document.getElementById('messageModal');
        if (msgModal) msgModal.classList.remove('hidden');
    } else if (action === 'whatsappMessage') {
        const waModal = document.getElementById('whatsappMessageModal');
        if (waModal) waModal.classList.remove('hidden');
        
        const msgInput = document.getElementById('msgContent');
        const sendBtn = document.querySelector('#whatsappMessageModal .wa-send-btn');
        const chatBody = document.getElementById('waChatBody');
        
        if (msgInput) {
            msgInput.disabled = true;
            msgInput.placeholder = "Yazıyor...";
        }
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
        }
        
        if (chatBody) {
            chatBody.innerHTML = '<div class="wa-date-chip">BugÃ¼n</div>';
            
            const showTyping = () => {
                const tId = 'typing-' + Date.now();
                chatBody.insertAdjacentHTML('beforeend', `<div class="wa-message wa-received" id="${tId}"><div class="wa-message-text" style="color:#aaa; font-style:italic; padding: 2px 5px;">YazÄ±yor...</div></div>`);
                chatBody.scrollTop = chatBody.scrollHeight;
                return tId;
            };

            const pushmsg = (txt) => {
                chatBody.insertAdjacentHTML('beforeend', `<div class="wa-message wa-received"><div class="wa-message-text">${txt}</div></div>`);
                chatBody.scrollTop = chatBody.scrollHeight;
            };

            let tId = showTyping();
            setTimeout(() => {
                document.getElementById(tId)?.remove();
                pushmsg('Merhaba, bakım ekibine hoş geldiniz.');
                
                tId = showTyping();
                setTimeout(() => {
                    document.getElementById(tId)?.remove();
                    pushmsg('Açık iş isteğiniz veya arızanız hakkında bilgi almak için yazabilirsiniz.');
                    
                    tId = showTyping();
                    setTimeout(() => {
                        document.getElementById(tId)?.remove();
                        pushmsg('Öneri, talep ve şikayetlerinizi doğrudan bakım ekibine iletebilirsiniz.');
                        
                        tId = showTyping();
                        setTimeout(() => {
                            document.getElementById(tId)?.remove();
                            pushmsg('Mesajınız ilgili bakım sorumlusuna yönlendirilecektir.');
                            
                            tId = showTyping();
                            setTimeout(() => {
                                document.getElementById(tId)?.remove();
                                pushmsg('Lütfen mesajınızı aşağıdaki alana yazınız.');
                                if (msgInput) {
                                    msgInput.disabled = false;
                                    msgInput.placeholder = "Mesaj yazın...";
                                    msgInput.focus();
                                }
                                if (sendBtn) {
                                    sendBtn.disabled = false;
                                    sendBtn.style.opacity = '1';
                                }
                            }, 800);
                        }, 800);
                    }, 800);
                }, 1200);
            }, 800);
        }
    }
};

window.loadFaultBoard = async () => {
    const tableHeader = document.getElementById('faultBoardTableHeader');
    const tableBody = document.getElementById('faultBoardTableBody');
    const loadingDiv = document.getElementById('faultBoardLoading');
    
    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';
    loadingDiv.style.display = 'block';

    try {
        // 1. AyarlarÄ± al
        let settings = {
            colDate: true, colName: true, colDept: true, 
            colMachine: true, colShift: false, colJobType: false, colDesc: true
        };
        const settingsDoc = await db.collection('ayarlar').doc('boardSettings').get();
        if (settingsDoc.exists) {
            settings = { ...settings, ...settingsDoc.data() };
        }

        // 2. Tablo BaÅŸlÄ±klarÄ±nÄ± OluÅŸtur
        let headersHTML = '';
        if (settings.colDate) headersHTML += '<th style="padding: 2px 4px; border-bottom: 2px solid #ddd;">Tarih</th>';
        if (settings.colName) headersHTML += '<th style="padding: 2px 4px; border-bottom: 2px solid #ddd;">Kişi</th>';
        if (settings.colDept) headersHTML += '<th style="padding: 2px 4px; border-bottom: 2px solid #ddd;">Departman</th>';
        if (settings.colMachine) headersHTML += '<th style="padding: 2px 4px; border-bottom: 2px solid #ddd;">Makine</th>';
        if (settings.colShift) headersHTML += '<th style="padding: 2px 4px; border-bottom: 2px solid #ddd;">Vardiya</th>';
        if (settings.colJobType) headersHTML += '<th style="padding: 2px 4px; border-bottom: 2px solid #ddd;">İş Tipi</th>';
        if (settings.colDesc) headersHTML += '<th style="padding: 2px 4px; border-bottom: 2px solid #ddd;">Açıklama</th>';
        tableHeader.innerHTML = headersHTML;

        // 3. Sadece AÃ§Ä±k ArÄ±zalarÄ± Getir
        // Firebase index hatasÄ±nÄ± Ã¶nlemek iÃ§in orderBy'Ä± yerel olarak yapacaÄŸÄ±z
        const snapshot = await db.collection('arizalar').where('status', 'in', ['Açık', 'AÃ§Ä±k']).get();
        
        loadingDiv.style.display = 'none';

        if (snapshot.empty) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px; color:#666;">Şu an açık arıza bulunmamaktadır. 😉</td></tr>`;
            return;
        }

        // Verileri al ve timestamp'e gÃ¶re azalan (yeniden eskiye) sÄ±rala
        const docs = [];
        snapshot.forEach(doc => docs.push(doc.data()));
        const getTime = (data) => {
            if (data.timestamp) {
                if (typeof data.timestamp.toMillis === 'function') return data.timestamp.toMillis();
                if (typeof data.timestamp === 'string') return new Date(data.timestamp).getTime();
            }
            if (data.createdAt) {
                if (typeof data.createdAt.toMillis === 'function') return data.createdAt.toMillis();
                if (typeof data.createdAt === 'string') return new Date(data.createdAt).getTime();
            }
            if (data.tarih_saat) {
                 try {
                     const parts = data.tarih_saat.split(' ');
                     const d = parts[0].split('.');
                     const t = parts[1] ? parts[1].split(':') : ['00','00','00'];
                     if (d.length === 3) return new Date(d[2], d[1]-1, d[0], t[0], t[1], t[2]||'00').getTime();
                 } catch(e) {}
            }
            return 0;
        };
        docs.sort((a, b) => getTime(b) - getTime(a));

        // 4. Verileri Tabloya Yaz
        let rowsHTML = '';
        let currentGroupDate = '';
        let colspanCount = 0;
        if(settings.colDate) colspanCount++;
        if(settings.colName) colspanCount++;
        if(settings.colDept) colspanCount++;
        if(settings.colMachine) colspanCount++;
        if(settings.colShift) colspanCount++;
        if(settings.colJobType) colspanCount++;
        if(settings.colDesc) colspanCount++;

        docs.forEach(data => {
            // Tarih verisini hem eski hem yeni formata gÃ¶re al
            let dateStr = '-';
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                dateStr = data.createdAt.toDate().toLocaleString('tr-TR');
            } else if (data.timestamp) {
                if (typeof data.timestamp === 'string') {
                    dateStr = new Date(data.timestamp).toLocaleString('tr-TR');
                } else if (typeof data.timestamp.toDate === 'function') {
                    dateStr = data.timestamp.toDate().toLocaleString('tr-TR');
                }
            } else if (data.tarih_saat) {
                dateStr = data.tarih_saat;
            }

            let justDate = dateStr.split(' ')[0];
            if (justDate !== currentGroupDate && dateStr !== '-') {
                currentGroupDate = justDate;
                rowsHTML += `<tr><td colspan="${colspanCount}" style="background-color:#7FFFD4; color:#111827; font-weight:bold; padding:8px 10px; text-align:left; border-bottom:2px solid #D1D5DB; border-top:4px solid #D1D5DB;">📅 ${currentGroupDate} Tarihli Arızalar</td></tr>`;
            }

            const name = data.userName || data.bildiren || data.name || '-';
            const dept = data.costCenter || data.department || '-';
            const machine = data.machine || data.makine || '-';
            const shift = data.shift || data.vardiya || '-';
            const jobType = data.jobType || data.ariza_tipi || '-';
            const desc = data.description || data.aciklama || '-';
            
            const rowBg = window.getRowBgColor(jobType);
            const rowTextColor = (rowBg === '#FF00FF' || rowBg === '#FF0000') ? '#FFFFFF' : '#333333';
            
            rowsHTML += `<tr style="border-bottom: 1px solid #ccc; background-color: ${rowBg}; color: ${rowTextColor};">`;
            if (settings.colDate) rowsHTML += `<td style="padding: 2px 4px;">${dateStr.includes(' ') ? dateStr.split(' ')[1] : dateStr}</td>`; // Sadece saat gosterelim gruplama oldugu icin
            if (settings.colName) rowsHTML += `<td style="padding: 2px 4px;">${name}</td>`;
            if (settings.colDept) rowsHTML += `<td style="padding: 2px 4px;">${dept}</td>`;
            if (settings.colMachine) rowsHTML += `<td style="padding: 2px 4px;">${machine}</td>`;
            if (settings.colShift) rowsHTML += `<td style="padding: 2px 4px;">${shift}</td>`;
            if (settings.colJobType) rowsHTML += `<td style="padding: 2px 4px;">${window.getJobTypeHTML(jobType)}</td>`;
            if (settings.colDesc) rowsHTML += `<td style="padding: 2px 4px;">${desc}</td>`;
            rowsHTML += '</tr>';
        });

        tableBody.innerHTML = rowsHTML;

    } catch (err) {
        console.error("Pano yÃ¼klenirken hata:", err);
        loadingDiv.innerText = "Veriler yÃ¼klenirken bir hata oluÅŸtu!";
        // Hata durumunda index bazlÄ± orderBy hatasÄ± olabilir (Firebase index istiyor olabilir).
        // Index yoksa alert verip console.log'dan linki tÄ±klamalarÄ±nÄ± hatÄ±rlatmalÄ±yÄ±z, ancak 
        // orderBy olmadan basit getirip js'de sÄ±ralamak daha gÃ¼venli (aylÄ±k bakÄ±m olduÄŸu iÃ§in sayÄ± azdÄ±r).
    }
};



// --- BAKIM EKIBINE MESAJ GONDER ---
window.sendOpMessage = async () => {
    const sendBtn = document.querySelector('.wa-send-btn');
    if (sendBtn && sendBtn.disabled) return; // Zaten gÃ¶nderiliyor

    const msgInput = document.getElementById('msgContent');
    const msg = msgInput.value.trim();
    
    if (msg.length < 5) {
        alert("Lütfen en az 5 harflik bir mesaj yazın.");
        return;
    }
    
    if (msgInput) {
        msgInput.value = "";
        msgInput.style.height = '';
    }
    
    // Butonu pasifleştir
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
    }
    
    // Add sent bubble to UI immediately
    const chatBody = document.getElementById('waChatBody');
    if (chatBody) {
        const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const bubbleHtml = `
            <div class="wa-message wa-sent">
                <div class="wa-message-text">${msg.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div class="wa-message-time">${timeStr} <svg class="wa-tick" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:-2px;"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', bubbleHtml);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    try {
        let opsList = [];
        try {
            const opsDoc = await db.collection("ayarlar").doc("operators").get();
            if (opsDoc.exists && opsDoc.data().list) {
                opsList = opsDoc.data().list;
                if (!opsList.includes("Admin")) {
                    opsList.push("Admin");
                }
            }
        } catch(err) {
            console.log("Ops err", err);
        }

        const trMonths = ["Ocak", "Åubat", "Mart", "Nisan", "MayÄ±s", "Haziran", "Temmuz", "AÄŸustos", "EylÃ¼l", "Ekim", "KasÄ±m", "AralÄ±k"];
        const now = new Date();
        const dateStr = `${now.getDate()} ${trMonths[now.getMonth()]} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} UTC+3`;

                        await db.collection("mesajlar").add({
            isim: "Sahadan Bildirim",
            gonderen: "Sahadan Bildirim",
            sender: "Sahadan Bildirim", // Eski sistem uyumlulugu icin
            mesaj: msg,
            text: msg, // Eski sistem uyumlulugu icin
            tarih: dateStr,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            metin: msg,
            hedefKullanicilar: opsList,
            oku: [],
            "olusturulma tarihi": firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Bakim Operatorlerinin kullandigi 'messages' tablosuna da aynisini yaziyoruz (Ops Panel uyumu)
        await db.collection("messages").add({
            sender: "Sahadan Bildirim",
            text: msg,
            targetUsers: opsList, // Ops paneli targetUsers kullaniyor
            readBy: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Change single tick to double blue tick
        if (chatBody) {
            const lastTick = chatBody.querySelector('.wa-sent:last-child .wa-tick');
            if (lastTick) {
                lastTick.outerHTML = '<svg class="wa-tick" viewBox="0 0 24 24" width="14" height="14" stroke="#53bdeb" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:-2px;"><polyline points="18 6 7 17 2 12"></polyline><polyline points="22 10 11 21 7 17"></polyline></svg>';
            }
        }
        
        // Custom WhatsApp style Toast instead of alert
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.top = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        toast.style.color = 'white';
        toast.style.padding = '15px 30px';
        toast.style.borderRadius = '30px';
        toast.style.fontSize = '1.2rem';
        toast.style.zIndex = '9999';
        toast.style.transition = 'opacity 0.5s';
        toast.innerHTML = 'MesajÄ±nÄ±z baÅŸarÄ±yla iletildi! <svg viewBox="0 0 24 24" width="18" height="18" stroke="#00a884" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-left: 5px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
        document.body.appendChild(toast);
        
        // Wait 2 seconds, fade out toast, and close modal
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
                document.getElementById('messageModal').classList.add('hidden');
                msgInput.value = "";
                msgInput.style.height = '';
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.style.opacity = '1';
                }
                if (chatBody) {
                    const sentBubbles = chatBody.querySelectorAll('.wa-sent');
                    sentBubbles.forEach(b => b.remove());
                }
            }, 500);
        }, 2000);
        
    } catch (e) {
        console.error(e);
        alert("Mesaj gÃ¶nderilirken hata oluÅŸtu. LÃ¼tfen tekrar deneyin.");
    }
};



document.addEventListener('DOMContentLoaded', () => {
    // V3: Onbellekten gelebilecek eski menu dugmelerini temizle.
    document.querySelectorAll('.admin-login-corner, .bottom-power-wrapper, .btn-power').forEach(el => el.remove());
    const topMenu = document.querySelector('.glass-top-menu');
    if (topMenu) {
        topMenu.querySelectorAll('button[title="Yönetici Paneli"], button[title="Kapat"]').forEach(el => el.remove());
    }
    const faultBoardClose = document.querySelector('#faultBoardModal button');
    if (faultBoardClose) {
        faultBoardClose.style.color = '#e53e3e';
        faultBoardClose.style.fontWeight = 'bold';
    }
});

window.sendWhatsappMessage = async () => {
    const sendBtn = document.querySelector('#whatsappMessageModal .wa-send-btn');
    if (sendBtn && sendBtn.disabled) return; 

    const msgInput = document.getElementById('msgContent');
    const msg = msgInput.value.trim();
    
    if (msg.length < 5) {
        alert("LÃ¼tfen en az 5 harflik bir mesaj yazÄ±n.");
        return;
    }
    
    // Butonu pasifleÅŸtir
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.5';
    }
    
    // Add sent bubble to UI immediately
    const chatBody = document.getElementById('waChatBody');
    if (chatBody) {
        const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const bubbleHtml = `
            <div class="wa-message wa-sent">
                <div class="wa-message-text">${msg.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                <div class="wa-message-time"><svg class="wa-tick" viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:-2px;"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            </div>
        `;
        chatBody.insertAdjacentHTML('beforeend', bubbleHtml);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    try {
        let opsList = [];
        try {
            const opsDoc = await db.collection("ayarlar").doc("operators").get();
            if (opsDoc.exists && opsDoc.data().list) {
                opsList = opsDoc.data().list;
                if (!opsList.includes("Admin")) {
                    opsList.push("Admin");
                }
            }
        } catch(err) {
            console.log("Ops err", err);
        }

        const trMonths = ["Ocak", "Åubat", "Mart", "Nisan", "MayÄ±s", "Haziran", "Temmuz", "AÄŸustos", "EylÃ¼l", "Ekim", "KasÄ±m", "AralÄ±k"];
        const now = new Date();
        const dateStr = `${now.getDate()} ${trMonths[now.getMonth()]} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} UTC+3`;

        await db.collection("mesajlar").add({
            isim: "Sahadan Bildirim",
            gonderen: "Sahadan Bildirim",
            sender: "Sahadan Bildirim", 
            mesaj: msg,
            text: msg, 
            tarih: dateStr,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            metin: msg,
            hedefKullanicilar: opsList,
            oku: [],
            "olusturulma tarihi": firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection("messages").add({
            sender: "Sahadan Bildirim",
            text: msg,
            targetUsers: opsList, 
            readBy: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Change single tick to double blue tick
        if (chatBody) {
            const lastTick = chatBody.querySelector('.wa-sent:last-child .wa-tick');
            if (lastTick) {
                lastTick.outerHTML = '<svg class="wa-tick" viewBox="0 0 24 24" width="14" height="14" stroke="#53bdeb" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:-2px;"><polyline points="18 6 7 17 2 12"></polyline><polyline points="22 10 11 21 7 17"></polyline></svg>';
            }
        }
        
        // YanÄ±t animasyonu ve modal kapama
        const typingId2 = 'typing-reply-2';
        chatBody.insertAdjacentHTML('beforeend', `<div class="wa-message wa-received" id="${typingId2}"><div class="wa-message-text" style="color:#aaa; font-style:italic; padding: 2px 5px;">YazÄ±yor...</div></div>`);
        chatBody.scrollTop = chatBody.scrollHeight;
        
        setTimeout(() => {
            document.getElementById(typingId2)?.remove();
            chatBody.insertAdjacentHTML('beforeend', `<div class="wa-message wa-received"><div class="wa-message-text">Teşekkürler, mesajın bakım birimine iletilmiştir.</div></div>`);
            chatBody.scrollTop = chatBody.scrollHeight;
            
            setTimeout(() => {
                document.getElementById('whatsappMessageModal').classList.add('hidden');
                msgInput.value = "";
                msgInput.style.height = '';
                if (sendBtn) {
                    sendBtn.disabled = false;
                    sendBtn.style.opacity = '1';
                }
                if (chatBody) {
                    const sentBubbles = chatBody.querySelectorAll('.wa-sent');
                    sentBubbles.forEach(b => b.remove());
                }
            }, 2000);
        }, 1200);
        
    } catch (e) {
        console.error(e);
        alert("Mesaj gÃ¶nderilirken hata oluÅŸtu. LÃ¼tfen tekrar deneyin.");
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
        }
    }
};

// ==========================================================================
// Usta Asistan Canlı Açılış Tanıtım Turu (Spotlight Guided Tour)
// ==========================================================================
window.tourSteps = [
    {
        targetId: 'navBtnBoard',
        badge: 'Tanıtım 1 / 2',
        pulseClass: 'tour-pulse-board',
        miniSpeech: '🛠️ Arıza Listesi Burada!',
        speech: '🛠️ Bakın! Buradaki "Arıza Listele" butonuna tıklayarak fabrikanın açık arızalarını görebilir ve takip edebilirsiniz.',
        btnText: 'Sonraki ➔'
    },
    {
        targetId: 'navBtnMessage',
        badge: 'Tanıtım 2 / 2',
        pulseClass: 'tour-pulse-message',
        miniSpeech: '💬 Bakım Mesaj / Öneri!',
        speech: '💬 Yanındaki "Bakım Mesaj" butonundan ise bakım ekibimize öneri, şikayet veya doğrudan mesaj yazabilirsiniz.',
        btnText: 'Forma Başla 🚀'
    }
];

let currentTourIndex = 0;
let tourAutoTimer = null;

window.flyMascotToButton = function(buttonEl) {
    const mascot = document.getElementById('mascotRobot');
    if (!mascot || !buttonEl) return;

    // Masayı ve buton konumunu doğru hesapla
    const prevTransform = mascot.style.transform;
    mascot.style.transition = 'none';
    mascot.style.transform = 'none';
    const baseRect = mascot.getBoundingClientRect();
    mascot.style.transform = prevTransform;
    void mascot.offsetHeight; // Reflow tetikle

    const btnRect = buttonEl.getBoundingClientRect();
    const deltaX = (btnRect.left + (btnRect.width / 2)) - (baseRect.left + (baseRect.width / 2)) - 15;
    const deltaY = (btnRect.bottom + 14) - baseRect.top;

    mascot.classList.add('mascot-flying');
    mascot.style.transition = 'transform 0.95s cubic-bezier(0.25, 1, 0.5, 1)';
    mascot.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.08)`;
};

window.flyMascotHome = function() {
    const mascot = document.getElementById('mascotRobot');
    const miniSpeech = document.getElementById('flyingMiniSpeech');
    if (miniSpeech) miniSpeech.classList.add('hidden');

    if (mascot) {
        mascot.style.transition = 'transform 0.9s cubic-bezier(0.34, 1.25, 0.64, 1)';
        mascot.style.transform = 'translate3d(0, 0, 0) scale(1)';
        setTimeout(() => {
            mascot.classList.remove('mascot-flying');
            mascot.style.transition = '';
            mascot.style.transform = '';
        }, 920);
    }
};

window.startOnboardingTour = function(force = true) {
    document.body.classList.add('tour-mode-active');

    const actionBar = document.getElementById('tourActionBar');
    if (actionBar) actionBar.classList.remove('hidden');

    currentTourIndex = 0;
    window.showTourStep(0);
};

window.showTourStep = function(index) {
    if (tourAutoTimer) clearTimeout(tourAutoTimer);

    // Önceki buton vurgularını temizle
    document.querySelectorAll('.tour-spotlight-active').forEach(el => {
        el.classList.remove('tour-spotlight-active', 'tour-pulse-board', 'tour-pulse-message');
    });

    const step = window.tourSteps[index];
    if (!step) {
        window.finishTour();
        return;
    }

    currentTourIndex = index;
    const targetEl = document.getElementById(step.targetId);
    const bubbleText = document.getElementById('assistantBubbleText');
    const badgeEl = document.getElementById('tourStepBadge');
    const nextBtn = document.getElementById('tourBtnNext');
    const miniSpeech = document.getElementById('flyingMiniSpeech');

    if (badgeEl) badgeEl.textContent = step.badge;
    if (bubbleText) {
        bubbleText.textContent = step.speech;
        bubbleText.style.opacity = '0';
        setTimeout(() => {
            bubbleText.style.transition = 'opacity 0.25s ease';
            bubbleText.style.opacity = '1';
        }, 50);
    }
    if (nextBtn) {
        const span = nextBtn.querySelector('span') || nextBtn;
        span.textContent = step.btnText;
    }

    if (miniSpeech) {
        miniSpeech.textContent = step.miniSpeech;
        miniSpeech.classList.remove('hidden');
    }

    if (targetEl) {
        targetEl.classList.add('tour-spotlight-active', step.pulseClass);
        // Usta Asistan butonun altına uçar
        window.flyMascotToButton(targetEl);
    }

    // 5 saniye sonra otomatik diğer adıma geç
    tourAutoTimer = setTimeout(() => {
        window.nextTourStep();
    }, 5000);
};

window.nextTourStep = function() {
    if (currentTourIndex + 1 < window.tourSteps.length) {
        window.showTourStep(currentTourIndex + 1);
    } else {
        window.finishTour();
    }
};

window.skipTour = function() {
    window.finishTour();
};

window.finishTour = function() {
    if (tourAutoTimer) clearTimeout(tourAutoTimer);

    // Buton vurgularını temizle
    document.querySelectorAll('.tour-spotlight-active').forEach(el => {
        el.classList.remove('tour-spotlight-active', 'tour-pulse-board', 'tour-pulse-message');
    });

    document.body.classList.remove('tour-mode-active');

    // Usta Asistan yerine uçar ve iniş yapar
    window.flyMascotHome();

    const actionBar = document.getElementById('tourActionBar');
    if (actionBar) actionBar.classList.add('hidden');

    // Usta Asistan 1. adıma dönsün
    setTimeout(() => {
        if (window.updateAssistantStep) {
            window.updateAssistantStep(1);
        } else {
            const bubbleText = document.getElementById('assistantBubbleText');
            if (bubbleText) {
                bubbleText.textContent = "Merhaba! 👋 Ben Usta Asistan. Arıza kaydı açmak için lütfen adınızı ve soyadınızı giriniz.";
            }
        }
        const nameInput = document.getElementById('userName');
        if (nameInput) {
            nameInput.focus();
        }
    }, 900);
};

// Sayfa açıldığında turu başlat
const launchTourOnReady = () => {
    setTimeout(() => {
        if (window.startOnboardingTour) {
            window.startOnboardingTour(true);
        }
    }, 450);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', launchTourOnReady);
} else {
    launchTourOnReady();
}




