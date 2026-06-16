
export function isPerfectSquare(n: number): boolean {
    if (n < 0) {
        return false;
    }

    const root: number = Math.sqrt(n);

    return Number.isInteger(root);
}// Todo: maybe use humanize-duration

export function humanReadable(seconds: number) {
    const pad = (num: number) => num.toString().padStart(2, "0");

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${pad(hours)}:${pad(minutes)}:${pad(remainingSeconds)}`;
}
export function tightFormat(num: number, decimals: number) {
    const format = (num / 10 ** decimals).toFixed(1).toString().replace(".0", "");
    return format;
}
export function generateSecureHexString(length: number) {
    const byteLength = Math.ceil(length / 2);
    const array = new Uint8Array(byteLength);

    // In a browser environment
    if (typeof window !== 'undefined' && window.crypto) {
        window.crypto.getRandomValues(array);
    }

    // In a Node.js environment
    // else if (typeof require !== 'undefined' && require('crypto')) {
    //     const buffer = crypto.randomBytes(byteLength);
    //     buffer.copy(array);
    // } else {
    //     throw new Error('No secure random source found');
    // }

    // Convert Uint8Array to a hex string
    // A modern approach uses .toHex() if supported, otherwise a manual conversion
    let hexString = '';
    for (let i = 0; i < array.length; i++) {
        // Pad with a leading zero if the hex value is a single digit
        hexString += array[i].toString(16).padStart(2, '0');
    }

    // Slice to the exact length in case of an odd length request
    return hexString.slice(0, length);
}

export function convertSvgElementToHtml(svgElement: SVGSVGElement): string {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
}

export function base64ToHex(base64: string): string {
    // Decode Base64 to a binary string
    const binaryString = atob(base64);

    // Convert the binary string to a Uint8Array
    const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));

    // Convert each byte to a two-digit hex string and join them
    return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function hexToBase64(hex: string): string {
    // Convert hex string to a Uint8Array
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }

    // Convert the Uint8Array to a binary string
    const binaryString = Array.from(bytes)
        .map(byte => String.fromCharCode(byte))
        .join('');

    // Encode the binary string to Base64
    return btoa(binaryString);
}

export async function hashStringSHA256(message: string): Promise<string> {
  // Encode the string as a Uint8Array
  const msgBuffer = new TextEncoder().encode(message);

  // Hash the buffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // Convert the ArrayBuffer to a hexadecimal string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}