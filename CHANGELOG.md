# CHANGELOG — resera-mobile

Formato: [Semver](https://semver.org) · Fecha: YYYY-MM-DD

---

## [0.3.0] — 2026-04-20

### Changed
- `api/client.ts`: URL del backend actualizada de IP local (`192.168.0.30:3000`) a producción en Railway:
  `https://resera-back-production.up.railway.app/api/v1`

---

## [0.2.0] — 2026-04-19

### Added
- Login: toggle para mostrar/ocultar contraseña (ícono 👁️/🙈 sobre el campo de password)

### Fixed
- `metro.config.js`: configurado con `withNativeWind` para NativeWind v4
- `babel.config.js`: `jsxImportSource: 'nativewind'` en `babel-preset-expo`
- `tailwind.config.js`: preset `nativewind/preset` para NativeWind v4
- `app/_layout.tsx`: import de `global.css` requerido por NativeWind v4
- `package.json`: versiones corregidas para Expo Go SDK 54 (`react-native: 0.81.5`, `react: 19.1.0`)
- Agregado `react-native-worklets` requerido por `babel-preset-expo@54` + reanimated v4
- `app.json`: `newArchEnabled: false` para compatibilidad con Expo Go

---

## [0.1.0] — 2026-04-18

### Added
- Primera versión del proyecto Expo + React Native
- Autenticación con JWT almacenado en `expo-secure-store`
- Refresh token automático en interceptor de Axios
- Rutas con `expo-router`: auth (login, register), vendor, buyer
- NativeWind v4 para estilos con TailwindCSS
- Pantallas: Login, Register, dashboards por rol
