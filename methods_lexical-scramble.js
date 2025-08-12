/*
 * File: methods/lexical-scramble.js
 * Contains the logic for Lexical Scramble obfuscation.
 * This method renames variables and functions to be unreadable and minifies the code.
 */
const lexicalScramble = (() => {
    // A simple regex-based approach. For production use, a proper AST parser (like Esprima/Acorn) is far superior.
    // This is a demonstrative implementation for educational purposes.

    /**
     * Finds potential identifiers (variable/function names) in the code.
     * @param {string} code The JavaScript code.
     * @returns {string[]} An array of unique identifiers.
     */
    function getIdentifiers(code) {
        // Remove comments and strings to avoid renaming things inside them
        const cleanCode = code
            .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove multi-line and single-line comments
            .replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, ''); // remove strings

        // A set of JavaScript reserved keywords that should not be renamed
        const keywords = new Set(['break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof', 'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'let', 'const', 'void', 'while', 'with', 'class', 'enum', 'export', 'extends', 'import', 'super', 'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield', 'await', 'null', 'true', 'false', 'undefined', 'document', 'window', 'console']);
        
        const identifiers = new Set();
        // Regex to find potential variable/function names.
        const identifierRegex = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
        let match;
        while ((match = identifierRegex.exec(cleanCode)) !== null) {
            if (!keywords.has(match[0])) {
                identifiers.add(match[0]);
            }
        }
        return Array.from(identifiers);
    }
    
    /**
     * Generates a short, non-numeric name based on an index. (a, b, ..., z, aa, ab, ...)
     * @param {number} n The index.
     * @returns {string} The generated name.
     */
    function generateName(n) {
        const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
        let name = '';
        do {
            name = alphabet[n % alphabet.length] + name;
            n = Math.floor(n / alphabet.length) - 1;
        } while (n >= 0);
        return name;
    }

    /**
     * Encodes the code by scrambling identifiers and minifying.
     * @param {string} code The JavaScript code.
     * @returns {{result: string, map: string}} The scrambled code and a map for deobfuscation.
     */
    function encode(code) {
        const identifiers = getIdentifiers(code);
        const nameMap = new Map();
        let scrambledCode = code;
        
        // Replace longer names first to avoid conflicts (e.g., replacing 'user' before 'username')
        identifiers.sort((a, b) => b.length - a.length);

        identifiers.forEach((oldName, i) => {
            const newName = generateName(i);
            nameMap.set(oldName, newName);
            // Use regex with word boundaries (\b) to avoid replacing parts of other words
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            scrambledCode = scrambledCode.replace(regex, newName);
        });

        // Minify: remove comments and extra whitespace
        scrambledCode = scrambledCode
            .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
            .replace(/\s+/g, ' '); // collapse whitespace

        const mapJson = JSON.stringify(Object.fromEntries(nameMap), null, 2);
        return { result: scrambledCode, map: mapJson };
    }

    /**
     * Decodes the scrambled code using a provided map.
     * @param {string} scrambledCode The code to deobfuscate.
     * @param {string} mapJson The JSON map of name changes.
     * @returns {{result: string, map: string}} The original code and a success message.
     */
    function decode(scrambledCode, mapJson) {
        if (!mapJson) {
            throw new Error("Deobfuscation map is required for Lexical Scramble.");
        }
        try {
            const nameMap = JSON.parse(mapJson);
            let originalCode = scrambledCode;
            const entries = Object.entries(nameMap);
            // Replace longer new names first to avoid conflicts
            entries.sort((a, b) => b[1].length - a[1].length);

            for (const [oldName, newName] of entries) {
                const regex = new RegExp(`\\b${newName}\\b`, 'g');
                originalCode = originalCode.replace(regex, oldName);
            }
            return { result: originalCode, map: "Successfully deobfuscated using the provided map." };
        } catch (e) {
            throw new Error("Failed to parse map or deobfuscate. " + e.message);
        }
    }

    return { encode, decode };
})();
