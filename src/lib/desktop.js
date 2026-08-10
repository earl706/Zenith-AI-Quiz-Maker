/** True when running inside the Tauri desktop shell (or VITE_DESKTOP=1). */
export function isDesktopApp() {
	const flag = String(import.meta.env.VITE_DESKTOP || '')
		.trim()
		.toLowerCase();
	if (flag === '1' || flag === 'true' || flag === 'yes') return true;
	if (typeof window === 'undefined') return false;
	return Boolean(window.__TAURI__ || window.__TAURI_INTERNALS__);
}

/** Desktop always remembers; web uses the checkbox (default on). */
export function defaultRememberMe() {
	return true;
}

export function effectiveRememberMe(rememberChecked) {
	if (isDesktopApp()) return true;
	return rememberChecked !== false;
}
