/*
 * File: methods/lana-vortex.js
 * Contains the logic for the Lana-Vortex obfuscation method.
 * This method provides layered, key-based encryption.
 */

const lanaVortex = (() => {
    /**
     * Generates a pseudo-random seed from a string key.
     * @param {string} key The secret key.
     * @returns {number} A numeric seed.
     */
    function createSeed(key) {
        let hash = 0;
        if (key.length === 0) return hash;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * A seeded pseudo-random number generator.
     * @param {number} seed The seed.
     * @returns {function(): number} A function that returns a random number between 0 and 1.
     */
    function seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    /**
     * Encrypts/Decrypts text using a key-based XOR cipher.
     * @param {string} text The text to process.
     * @param {string} key The secret key.
     * @returns {string} The processed text.
     */
    function xorCipher(text, key) {
        return text.split('').map((char, i) => {
            return String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length));
        }).join('');
    }

    /**
     * Encodes the given code using the Lana-Vortex method.
     * @param {string} code The JavaScript code to encode.
     * @param {string} key The secret key.
     * @returns {{result: string, map: string}} The obfuscated code and a log message.
     */
    function encode(code, key) {
        if (!code || !key) {
            throw new Error("Code and key cannot be empty for Lana-Vortex.");
        }

        // 1. Fragmentation
        const chunkSize = Math.max(2, Math.floor(key.length / 2));
        let fragments = [];
        for (let i = 0; i < code.length; i += chunkSize) {
            fragments.push(code.substring(i, i + chunkSize));
        }

        // 2. Key-based Shuffling
        const random = seededRandom(createSeed(key));
        const shuffledIndices = fragments.map((_, i) => i).sort(() => random() - 0.5);
        
        let shuffledFragments = [];
        let originalOrderMap = new Array(fragments.length);
        shuffledIndices.forEach((originalIndex, newIndex) => {
            shuffledFragments[newIndex] = fragments[originalIndex];
            originalOrderMap[originalIndex] = newIndex;
        });

        // 3. Key-based Substitution Cipher (XOR) and Base64 encoding
        const encryptedFragments = shuffledFragments.map(frag => btoa(xorCipher(frag, key)));
        const payload = JSON.stringify(encryptedFragments);
        const orderMap = JSON.stringify(originalOrderMap);
        const decoderKey = btoa(key); // Obfuscate the key slightly for the wrapper

        // 4. Self-Decoding Wrapper Generation (minified)
        const wrapper = `(function(){var p=${payload},m=${orderMap},k=atob("${decoderKey}"),x=function(t,k){return t.split('').map(function(c,i){return String.fromCharCode(c.charCodeAt(0)^k.charCodeAt(i%k.length))}).join('')},d=new Array(p.length);p.forEach(function(e,i){var oi=m.indexOf(i);d[oi]=x(atob(e),k)});(new Function(d.join('')))()})();`;
        
        return { 
            result: wrapper.trim(), 
            map: "Deobfuscation requires the original key. The result is a self-executing script." 
        };
    }

    /**
     * Decodes the given Lana-Vortex obfuscated code.
     * @param {string} encodedCode The obfuscated code.
     * @param {string} key The secret key used for encoding.
     * @returns {{result: string, map: string}} The original code and a success message.
     */
    function decode(encodedCode, key) {
        if (!encodedCode || !key) {
            throw new Error("Encoded code and key are required for decoding.");
        }
        try {
            // Extract the payload and map from the code using regex
            const payloadMatch = encodedCode.match(/var p=(\[.*?\])/);
            const mapMatch = encodedCode.match(/var m=(\[.*?\])/);
            if (!payloadMatch || !mapMatch) {
                throw new Error("Invalid Lana-Vortex format. Cannot find payload or map.");
            }

            const payload = JSON.parse(payloadMatch[1]);
            const orderMap = JSON.parse(mapMatch[1]);
            
            // Decrypt the shuffled fragments
            let decryptedShuffled = payload.map(frag => xorCipher(atob(frag), key));
            
            // Re-sort the fragments to their original order
            let originalFragments = new Array(payload.length);
            decryptedShuffled.forEach((frag, i) => {
                const originalIndex = orderMap.indexOf(i);
                if (originalIndex === -1) throw new Error("Map is inconsistent. Cannot find original index.");
                originalFragments[originalIndex] = frag;
            });

            return { 
                result: originalFragments.join(''), 
                map: "Successfully deobfuscated with the provided key." 
            };
        } catch (e) {
            throw new Error("Decoding failed. The key might be incorrect or the code is corrupted. " + e.message);
        }
    }

    // Expose public functions
    return { encode, decode };
})();
