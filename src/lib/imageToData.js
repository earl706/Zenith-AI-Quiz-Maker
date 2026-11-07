import { api } from './api';
import { getActiveLlmCredentials } from '../stores/llmStore';

/** Max images in one ImageToDataPipeline session (matches backend). */
export const MAX_BULK_IMAGES = 10;

const SCAN_TIMEOUT_MS = 120_000;
const SCAN_AUTO_RETRY_DELAY_MS = 1500;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendLlmFields(form) {
	const llm = getActiveLlmCredentials();
	if (!llm) return;
	form.append('llm_provider', llm.provider);
	form.append('llm_api_key', llm.apiKey);
	form.append('llm_model', llm.model);
}

function appendSchemaFields(form, { prompt, jsonSchema }) {
	form.append('prompt', prompt || '');
	if (jsonSchema != null) {
		form.append(
			'json_schema',
			typeof jsonSchema === 'string' ? jsonSchema : JSON.stringify(jsonSchema)
		);
	}
}

function isTransientScanDetail(detail = '') {
	const text = String(detail).toLowerCase();
	return (
		text.includes('temporarily unavailable') ||
		text.includes('503') ||
		text.includes('429') ||
		text.includes('could not parse') ||
		text.includes('timed out') ||
		text.includes('timeout') ||
		text.includes('rate limit') ||
		text.includes('overloaded') ||
		text.includes('try again') ||
		text.includes('retry shortly')
	);
}

function shouldAutoRetryScanData(data) {
	const results = data?.results;
	if (!Array.isArray(results) || !results.length) return false;
	return results.every((row) => !row?.ok && isTransientScanDetail(row?.detail));
}

function isTransientAxiosError(err) {
	if (!err) return false;
	if (!err.response) {
		const code = err.code || '';
		const message = String(err.message || '').toLowerCase();
		return (
			code === 'ECONNABORTED' ||
			code === 'ERR_NETWORK' ||
			message.includes('timeout') ||
			message.includes('network')
		);
	}
	const status = err.response.status;
	if (status === 408 || status === 429 || status === 502 || status === 503 || status === 504) {
		return true;
	}
	const detail = err.response?.data?.detail;
	return typeof detail === 'string' && isTransientScanDetail(detail);
}

async function postImageScan(url, buildForm) {
	const config = { timeout: SCAN_TIMEOUT_MS };
	const attempt = async () => {
		const form = buildForm();
		const { data } = await api.post(url, form, config);
		return data;
	};

	try {
		const data = await attempt();
		if (shouldAutoRetryScanData(data)) {
			await sleep(SCAN_AUTO_RETRY_DELAY_MS);
			return attempt();
		}
		return data;
	} catch (err) {
		if (!isTransientAxiosError(err)) throw err;
		await sleep(SCAN_AUTO_RETRY_DELAY_MS);
		return attempt();
	}
}

/** Single-image extract — does not persist. */
export async function scanImageToData(file, { prompt, jsonSchema } = {}) {
	return postImageScan('/image-to-data/scan/', () => {
		const form = new FormData();
		form.append('image', file);
		appendSchemaFields(form, { prompt, jsonSchema });
		appendLlmFields(form);
		return form;
	});
}

/**
 * Bulk extract for 1–10 prepared images.
 * Returns { results: [{ index, ok, draft?|detail? }], summary }.
 */
export async function bulkScanImageToData(files, { prompt, jsonSchema } = {}) {
	if (!Array.isArray(files) || !files.length) {
		throw new Error('At least one image is required.');
	}
	if (files.length > MAX_BULK_IMAGES) {
		throw new Error(`At most ${MAX_BULK_IMAGES} images per batch.`);
	}
	return postImageScan('/image-to-data/bulk-scan/', () => {
		const form = new FormData();
		form.append('count', String(files.length));
		files.forEach((file, index) => {
			form.append(`image_${index}`, file);
		});
		appendSchemaFields(form, { prompt, jsonSchema });
		appendLlmFields(form);
		return form;
	});
}

/** Demo schema: image → list of Items fields. */
export const ITEMS_SCAN_JSON_SCHEMA = {
	type: 'object',
	properties: {
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					title: { type: 'string' },
					description: { type: 'string' },
					status: { type: 'string', enum: ['active', 'archived'] }
				},
				required: ['title']
			}
		}
	},
	required: ['items']
};

export const ITEMS_SCAN_PROMPT = `Extract every distinct item / product / task visible in this image
into structured data for a personal inventory app.

Rules:
- Prefer short titles; put extra detail in description
- status must be "active" unless the image clearly marks something done/archived
- Skip headers, logos, and decorative text that are not items
- If only one item is shown, return a one-element items array`;

export const ITEMS_SCAN_FIELDS = [
	{ key: 'title', label: 'Title', type: 'text', required: true },
	{ key: 'description', label: 'Description', type: 'textarea' },
	{
		key: 'status',
		label: 'Status',
		type: 'select',
		options: [
			{ value: 'active', label: 'Active' },
			{ value: 'archived', label: 'Archived' }
		]
	}
];
