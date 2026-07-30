/**
 * Resolve quiz image values for <img src>.
 * Accepts absolute http(s), data URLs, or app-relative /static/... paths.
 */
export function resolveQuizImageSrc(value) {
	if (!value) return null;
	const s = String(value).trim();
	if (!s) return null;
	if (
		s.startsWith('data:') ||
		s.startsWith('blob:') ||
		s.startsWith('http://') ||
		s.startsWith('https://')
	) {
		return s;
	}
	if (s.startsWith('/')) {
		const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
		try {
			const resolved = new URL(
				apiBase,
				typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000'
			);
			return `${resolved.origin}${s}`;
		} catch {
			return s;
		}
	}
	return s;
}

/** True when value is a remote or static URL (not a File / data URL preview from upload). */
export function isExternalOrStaticImageUrl(value) {
	if (!value || typeof value !== 'string') return false;
	const s = value.trim();
	return (
		s.startsWith('http://') ||
		s.startsWith('https://') ||
		s.startsWith('/static/') ||
		s.startsWith('/media/')
	);
}
