// Menunggu hingga seluruh halaman HTML selesai dimuat
document.addEventListener('DOMContentLoaded', () => {

    // Mengambil elemen-elemen HTML yang dibutuhkan
    const qrForm = document.getElementById('qr-form');
    const qrTypeSelect = document.getElementById('qr-type');
    const qrTextInput = document.getElementById('qr-text');
    const qrContainer = document.getElementById('qr-code-container');
    const downloadLink = document.getElementById('download-link');

    // Placeholder untuk setiap tipe QR Code untuk memandu pengguna
    const placeholders = {
        text: 'Ketik teks apa saja di sini...',
        url: 'https://www.google.com',
        wifi: 'Format: WIFI:T:<WPA|WEP|nopass>;S:<NamaSSID>;P:<Password>;H:<true|false>;',
        calendar: `Format vEvent:\nBEGIN:VEVENT\nSUMMARY:Judul Acara\nDTSTART:20251225T100000Z\nDTEND:20251225T120000Z\nLOCATION:Lokasi Acara\nDESCRIPTION:Deskripsi singkat\nEND:VEVENT`
    };

    // Fungsi untuk mengubah placeholder di textarea sesuai dengan tipe QR yang dipilih
    const updatePlaceholder = () => {
        const selectedType = qrTypeSelect.value;
        qrTextInput.placeholder = placeholders[selectedType];
    };

    // Fungsi utama untuk membuat QR Code
    const generateQrCode = (event) => {
        event.preventDefault(); // Mencegah form untuk refresh halaman

        const text = qrTextInput.value.trim();
        
        // Jika tidak ada input, jangan lakukan apa-apa
        if (!text) {
            alert('Harap masukkan konten untuk dibuatkan QR Code!');
            return;
        }

        // Mengosongkan kontainer QR code sebelum membuat yang baru
        qrContainer.innerHTML = '';
        downloadLink.style.display = 'none'; // Sembunyikan tombol download

        // Opsi untuk QR Code (kualitas, ukuran, warna)
        const qrOptions = {
            errorCorrectionLevel: 'H', // H = High, untuk QR code yang lebih tahan kerusakan
            type: 'image/png',
            quality: 0.9,
            margin: 1,
            width: 256,
            color: {
                dark: "#000000",
                light: "#FFFFFF"
            }
        };

        // Membuat QR Code dan menampilkannya
        QRCode.toDataURL(text, qrOptions, (err, url) => {
            if (err) {
                console.error(err);
                qrContainer.innerHTML = '<p>Maaf, terjadi kesalahan saat membuat QR Code.</p>';
                return;
            }

            // Membuat elemen gambar
            const img = document.createElement('img');
            img.src = url;

            // Menampilkan gambar di dalam kontainer
            qrContainer.appendChild(img);
            
            // Menyiapkan dan menampilkan tombol download
            downloadLink.href = url;
            downloadLink.style.display = 'block'; // Tampilkan tombol
            downloadLink.classList.add('button'); // Tambahkan style button
        });
    };

    // Menambahkan event listener ke form saat disubmit
    qrForm.addEventListener('submit', generateQrCode);

    // Menambahkan event listener ke dropdown untuk mengubah placeholder
    qrTypeSelect.addEventListener('change', updatePlaceholder);

    // Memanggil fungsi pertama kali untuk mengatur placeholder awal
    updatePlaceholder();
});
