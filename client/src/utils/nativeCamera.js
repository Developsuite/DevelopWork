// Native-aware image picking.
//
// On the web we keep using the normal <input type="file">. In the Capacitor app
// we use the Camera plugin so the user gets a native "Take Photo / Choose from
// Gallery" prompt with proper permission handling. Both paths return a File so
// callers can upload it exactly the way they already do.

import { Capacitor } from '@capacitor/core';
import { isNativeApp } from './nativeFiles';

/**
 * Pick an image in the native app.
 * @param {{ source?: 'prompt'|'camera'|'photos' }} opts
 * @returns {Promise<File|null>} a File (jpeg), or null if the user cancelled.
 */
export async function pickImageNative({ source = 'prompt', quality = 80, width } = {}) {
    if (!isNativeApp()) return null; // caller should fall back to the file input

    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    const sourceMap = {
        prompt: CameraSource.Prompt,
        camera: CameraSource.Camera,
        photos: CameraSource.Photos,
    };

    const photo = await Camera.getPhoto({
        quality,
        ...(width ? { width } : {}),
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: sourceMap[source] || CameraSource.Prompt,
    });

    if (!photo?.webPath) return null;

    const res = await fetch(Capacitor.convertFileSrc(photo.webPath));
    const blob = await res.blob();
    const ext = photo.format || 'jpeg';
    return new File([blob], `photo_${Date.now()}.${ext}`, { type: blob.type || `image/${ext}` });
}

export { isNativeApp };
