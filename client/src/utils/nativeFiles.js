// Native-aware file saving.
//
// In a normal browser we trigger the usual anchor / jsPDF download. Inside the
// Capacitor WebView those do nothing (no browser download manager), so the file
// never reaches the phone. Here we detect the native app, write the file to the
// public Documents folder (visible in the Files app), and open the share sheet
// so the user can open it in a viewer or save it anywhere (Downloads, Drive…).

import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => Capacitor.isNativePlatform();

// Blob -> base64 (strips the "data:*;base64," prefix that Filesystem doesn't want)
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function webDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Save a Blob to the device.
 * - Web: regular browser download.
 * - Native: writes to Documents, then opens the share/open sheet.
 * @returns {Promise<{ saved: boolean, web?: boolean, uri?: string }>}
 */
export async function saveBlob(blob, filename, { share = true } = {}) {
    if (!isNativeApp()) {
        webDownload(blob, filename);
        return { saved: true, web: true };
    }

    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const data = await blobToBase64(blob);

    // Prefer the public Documents folder (visible in the Files app). On newer
    // Android that can be restricted, so fall back to the app Cache, which is
    // always writable — the share sheet still lets the user save it anywhere.
    let directory = Directory.Documents;
    try {
        await Filesystem.writeFile({ path: filename, data, directory, recursive: true });
    } catch {
        directory = Directory.Cache;
        await Filesystem.writeFile({ path: filename, data, directory, recursive: true });
    }

    const { uri } = await Filesystem.getUri({ path: filename, directory });

    if (share) {
        try {
            const { Share } = await import('@capacitor/share');
            await Share.share({ title: filename, text: filename, url: uri });
        } catch {
            // User dismissed the sheet — the file is already saved on the device.
        }
    }

    return { saved: true, uri };
}

/** Save a jsPDF document (uses doc.output('blob') on native, doc.save() on web). */
export async function savePdfDoc(pdf, filename) {
    if (!isNativeApp()) {
        pdf.save(filename);
        return { saved: true, web: true };
    }
    const blob = pdf.output('blob');
    return saveBlob(blob, filename);
}

/** Save raw text (CSV, etc.). */
export async function saveTextFile(text, filename, mime = 'text/csv;charset=utf-8;') {
    const blob = new Blob([text], { type: mime });
    return saveBlob(blob, filename);
}
