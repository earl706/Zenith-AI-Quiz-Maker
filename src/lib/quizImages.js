/**
 * Resolve quiz image values for <img src>.
 * Accepts absolute http(s), data URLs, or app-relative /static|/media paths.
 * Keep in sync with api.js default API host for local Vite.
 */
const DEFAULT_API_BASE = 'http://127.0.0.1:8001/api';

function apiOrigin() {
	const apiBase = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
	try {
		return new URL(
			apiBase,
			typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8001'
		).origin;
	} catch {
		return 'http://127.0.0.1:8001';
	}
}

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
		return `${apiOrigin()}${s}`;
	}
	return s;
}

/** Question image from either display field or stored URL. */
export function resolveQuestionImageSrc(question) {
	if (!question) return null;
	return (
		resolveQuizImageSrc(question.question_image) ||
		resolveQuizImageSrc(question.question_image_url) ||
		null
	);
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
