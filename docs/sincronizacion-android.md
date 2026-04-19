# Guía de Sincronización de la Aplicación Android (Capacitor)

Este documento detalla cómo sincronizar y compilar la aplicación de Android utilizando Capacitor para el proyecto **Zound**, tanto para desarrollo local como para producción.

## 1. Requisitos Previos
- Asegúrate de tener instalado **Android Studio**.
- Debes tener instaladas las dependencias del proyecto ejecutando `pnpm install`.
- El emulador de Android o tu dispositivo físico deben estar conectados y ser reconocidos (puedes verificarlo corriendo `adb devices`).

## 2. Desarrollo Local (Pruebas en tu dispositivo/emulador)

Si deseas probar la aplicación en un dispositivo físico o emulador apuntando a tu servidor local de Next.js, sigue estos pasos:

1. **Inicia el servidor local de Next.js** asegurándote de que expone tu IP local (automáticamente configurado así por Next.js):
   ```bash
   pnpm dev
   ```
   > Anota la dirección de *Network* que aparece en consola (ej. `http://192.168.3.45:3000`).

2. **Modifica `capacitor.config.ts`** temporalmente para apuntar a tu servidor local:
   ```typescript
   import type { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.ramirozein.zound',
     appName: 'Zound',
     webDir: 'public',
     bundledWebRuntime: false,
     server: {
       url: 'http://192.168.3.45:3000', // <-- Reemplaza por la IP de tu red
       cleartext: true                  // <-- Importante para permitir HTTP en Android
     }
   };

   export default config;
   ```

3. **Sincroniza los cambios con el proyecto Android**:
   ```bash
   npx cap sync android
   ```

4. **Abre el proyecto en Android Studio** (opcional) o compila directamente:
   ```bash
   npx cap open android
   ```
   Desde Android Studio, selecciona tu dispositivo y presiona **Run (▶)**.

## 3. Preparación para Producción

Antes de compilar la versión definitiva de la aplicación (APK / AAB), debes usar la URL del servidor productivo.

1. **Restaura el archivo `capacitor.config.ts`** a la URL de producción:
   ```typescript
   import type { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.ramirozein.zound',
     appName: 'Zound',
     webDir: 'public',
     bundledWebRuntime: false,
     server: {
       url: 'https://musica.ramirozein.me', // <-- URL de producción
       cleartext: false
     }
   };

   export default config;
   ```

2. **Sincroniza los archivos de Capacitor con el directorio de Android**:
   ```bash
   npx cap sync android
   ```
   *Este comando actualiza los manifiestos, variables y configuraciones de Capacitor dentro del directorio `/android`.*

3. **Compilar la aplicación final**:
   - Ejecuta `npx cap open android`.
   - Espera a que Gradle termine la sincronización.
   - Ve a la barra de menú: **Build > Generate Signed Bundle / APK...** y sigue los pasos para firmar y exportar la aplicación.

## Resolución de Problemas Comunes

- **Error `ERR_CLEARTEXT_NOT_PERMITTED`**: Se produce cuando intentas acceder a `http://` en una app de Android > 9 sin haber habilitado `cleartext: true` en el config.
- **La app se queda en blanco**: Asegúrate de que el servidor web esté corriendo. Si estás en local, verifica que tu celular y tu computadora estén en la misma red Wi-Fi y no haya firewalls bloqueando el puerto 3000.
