document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const get = (id) => document.getElementById(id);
    const methodSelect = get('method-select');
    const keyInputContainer = get('key-input-container');
    const secretKeyInput = get('secret-key');
    const codeInput = get('code-input');
    const fileInput = get('file-input');
    const codeOutput = get('code-output');
    const mapOutput = get('map-output');
    const obfuscateBtn = get('obfuscate-btn');
    const deobfuscateBtn = get('deobfuscate-btn');
    const copyOutputBtn = get('copy-output-btn');
    const copyMapBtn = get('copy-map-btn');
    const notification = get('notification');

    // --- Method Mapping ---
    const methods = {
        'lana-vortex': { 
            handler: lanaVortex, 
            requiresKey: true,
            canDeobfuscate: true,
            deobfuscateRequiresMap: false
        },
        'lexical-scramble': { 
            handler: lexicalScramble, 
            requiresKey: false,
            canDeobfuscate: true,
            deobfuscateRequiresMap: true
        },
        'string-conceal': { 
            handler: stringConceal, 
            requiresKey: true,
            canDeobfuscate: true, // Reveals strings, doesn't reconstruct code
            deobfuscateRequiresMap: false
        }
    };

    // --- UI Logic ---
    function updateUI() {
        const selectedMethod = methods[methodSelect.value];
        keyInputContainer.style.display = selectedMethod.requiresKey ? 'block' : 'none';
        deobfuscateBtn.style.display = selectedMethod.canDeobfuscate ? 'inline-flex' : 'none';
        mapOutput.placeholder = selectedMethod.deobfuscateRequiresMap 
            ? "Peta untuk deobfuscation akan muncul di sini. Anda membutuhkannya untuk membalikkan proses."
            : "Log proses atau informasi tambahan akan muncul di sini.";
    }

    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.style.backgroundColor = isError ? '#da3633' : '#238636';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function copyToClipboard(textarea, name) {
        if (!textarea.value) {
            showNotification(`${name} kosong, tidak ada yang bisa disalin.`, true);
            return;
        }
        textarea.select();
        document.execCommand('copy');
        showNotification(`${name} berhasil disalin!`);
        window.getSelection().removeAllRanges();
    }

    // --- Event Listeners ---
    methodSelect.addEventListener('change', updateUI);

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            codeInput.value = e.target.result;
            showNotification(`File '${file.name}' berhasil dimuat.`);
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    obfuscateBtn.addEventListener('click', () => {
        const selectedMethod = methods[methodSelect.value];
        const code = codeInput.value;
        const key = secretKeyInput.value;

        if (!code) {
            showNotification("Kode sumber tidak boleh kosong!", true);
            return;
        }

        try {
            const { result, map } = selectedMethod.handler.encode(code, key);
            codeOutput.value = result;
            mapOutput.value = map || 'Tidak ada peta/log yang dihasilkan untuk metode ini.';
            showNotification('Kode berhasil di-obfuscate!');
        } catch (e) {
            showNotification(`Error: ${e.message}`, true);
        }
    });

    deobfuscateBtn.addEventListener('click', () => {
        const selectedMethod = methods[methodSelect.value];
        const code = codeOutput.value; // Deobfuscate from the output pane
        const key = secretKeyInput.value;
        const map = mapOutput.value;

        if (!code) {
            showNotification("Tidak ada output untuk di-deobfuscate!", true);
            return;
        }
        
        const arg = selectedMethod.deobfuscateRequiresMap ? map : key;

        try {
            const { result, map: log } = selectedMethod.handler.decode(code, arg);
            // Put result back in the input for clarity
            codeInput.value = result;
            mapOutput.value = log || "Proses deobfuscation selesai.";
            showNotification('Proses deobfuscate berhasil!');
        } catch (e) {
            showNotification(`Error: ${e.message}`, true);
        }
    });

    copyOutputBtn.addEventListener('click', () => copyToClipboard(codeOutput, 'Output'));
    copyMapBtn.addEventListener('click', () => copyToClipboard(mapOutput, 'Peta/Log'));

    // --- Initial State ---
    updateUI();
});
