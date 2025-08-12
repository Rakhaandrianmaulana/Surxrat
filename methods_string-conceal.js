/*
 * File: methods/string-conceal.js
 * Contains the logic for String Concealment obfuscation.
 * This method extracts all strings into an encrypted array and replaces them with a decoder call.
 */
const stringConceal = (() => {
    /**
     * A simple XOR cipher for encrypting/decrypting strings.
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
     * Encodes the code by concealing all string literals.
     * @param {string} code The JavaScript code.
     * @param {string} key A secret key for encrypting the strings.
     * @returns {{result: string, map: string}} The obfuscated code and a log.
     */
    function encode(code, key) {
        if (!key) {
            throw new Error("A secret key is required for String Concealment.");
        }
        
        // Regex to find string literals (handles escaped quotes)
        const stringRegex = /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g;
        const strings = [];
        
        // First pass: extract all strings and replace them with a placeholder
        const codeWithoutStrings = code.replace(stringRegex, (match, dblQuoteStr, sglQuoteStr) => {
            const extractedString = dblQuoteStr !== undefined ? dblQuoteStr : sglQuoteStr;
            const stringIndex = strings.length;
            strings.push(extractedString);
            return `__DECRYPT_PLACEHOLDER__(${stringIndex})`;
        });

        if (strings.length === 0) {
            return { result: code, map: "No strings found to conceal." };
        }

        // Encrypt the collected strings using the provided key
        const encryptedStrings = strings.map(s => btoa(xorCipher(s, key)));

        // Create the decoder function and the final code
        const arrayName = '_S' + Math.random().toString(36).substring(2, 6); // Randomize array name
        const funcName = '_D' + Math.random().toString(36).substring(2, 6); // Randomize function name
        
        // The self-contained decoder logic
        const decoderLogic = `var ${arrayName}=${JSON.stringify(encryptedStrings)};var ${funcName}=function(i){var k="${btoa(key)}";return atob(${arrayName}[i]).split('').map(function(c,j){return String.fromCharCode(c.charCodeAt(0)^atob(k).charCodeAt(j%atob(k).length))}).join('')};`;
        
        // Replace placeholders with the actual decoder function call
        const finalCode = decoderLogic + codeWithoutStrings.replace(/__DECRYPT_PLACEHOLDER__\((.*?)\)/g, `${funcName}($1)`);
        
        return { 
            result: finalCode, 
            map: `Concealed ${strings.length} strings. Deobfuscation can reveal the strings but not reconstruct the code automatically.` 
        };
    }

    /**
     * "Decodes" the code by extracting and decrypting the concealed strings.
     * Note: This does not reconstruct the original code, it only reveals the hidden strings.
     * @param {string} code The obfuscated code.
     * @param {string} key The secret key used for encoding.
     * @returns {{result: string, map: string}} A message and the list of revealed strings.
     */
    function decode(code, key) {
        if (!key) {
            throw new Error("A secret key is required to reveal strings.");
        }
        try {
            // Dynamically find the array and key variable names
            const arrayMatch = code.match(/var (_S[a-zA-Z0-9]+)=(\[.*?\]);/);
            const keyMatch = code.match(/var k="([a-zA-Z0-9=]+)";/);

            if (!arrayMatch || !keyMatch) {
                throw new Error("Could not find the concealed string array or key in the code.");
            }
            
            const encryptedStrings = JSON.parse(arrayMatch[2]);
            const encodedKey = keyMatch[1];

            // Check if the provided key matches the one in the script
            if (btoa(key) !== encodedKey) {
                throw new Error("The provided key is incorrect.");
            }

            const decryptedStrings = encryptedStrings.map(s => xorCipher(atob(s), key));
            
            const map = "Revealed strings from the concealed array:\n\n" + decryptedStrings.map((s, i) => `${i}: "${s}"`).join('\n');
            return { 
                result: "// Code cannot be automatically reconstructed.\n// See the map/log for the list of revealed strings.", 
                map: map 
            };
        } catch(e) {
            throw new Error("Failed to reveal strings. " + e.message);
        }
    }

    return { encode, decode };
})();
