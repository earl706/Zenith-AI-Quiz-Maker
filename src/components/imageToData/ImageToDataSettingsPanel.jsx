import { useState } from 'react';

import { LLM_PROVIDERS, useLlmStore } from '../../stores/llmStore';
import { toast } from '../../stores/toastStore';
import { Button, Card, CardBody, CardHeader, Input } from '../ui';

const PROVIDER_LABELS = {
	openai: 'OpenAI',
	gemini: 'Gemini'
};

/** Settings → Image AI: client-side provider keys for ImageToDataPipeline. */
export function ImageToDataSettingsPanel() {
	const {
		provider,
		openaiApiKey,
		openaiModel,
		geminiApiKey,
		geminiModel,
		setProvider,
		setOpenAI,
		setGemini,
		clearKeys
	} = useLlmStore();

	const [openaiKeyDraft, setOpenaiKeyDraft] = useState(null);
	const [openaiModelDraft, setOpenaiModelDraft] = useState(null);
	const [geminiKeyDraft, setGeminiKeyDraft] = useState(null);
	const [geminiModelDraft, setGeminiModelDraft] = useState(null);

	return (
		<Card>
			<CardHeader
				title="Image AI"
				subtitle="Used for image → structured data scans when a key is saved"
			/>
			<CardBody className="space-y-4">
				<div>
					<span className="text-fg mb-1.5 block text-sm font-medium">Provider</span>
					<div className="flex gap-2">
						{LLM_PROVIDERS.map((p) => (
							<button
								key={p}
								type="button"
								onClick={() => setProvider(p)}
								className={`flex-1 cursor-pointer rounded-md border px-4 py-2 text-sm ${
									provider === p ? 'border-primary text-primary' : 'border-line text-muted'
								}`}
							>
								{PROVIDER_LABELS[p]}
							</button>
						))}
					</div>
				</div>

				{provider === 'openai' ? (
					<>
						<Input
							label="OpenAI API key"
							type="password"
							autoComplete="new-password"
							name="openai-api-key"
							value={openaiKeyDraft != null ? openaiKeyDraft : openaiApiKey}
							onChange={(e) => setOpenaiKeyDraft(e.target.value)}
							onBlur={() => {
								if (openaiKeyDraft == null) return;
								if (openaiKeyDraft === openaiApiKey) {
									setOpenaiKeyDraft(null);
									return;
								}
								setOpenAI({ apiKey: openaiKeyDraft });
								setOpenaiKeyDraft(null);
							}}
							placeholder="sk-…"
						/>
						<Input
							label="OpenAI model"
							value={openaiModelDraft != null ? openaiModelDraft : openaiModel}
							onChange={(e) => setOpenaiModelDraft(e.target.value)}
							onBlur={() => {
								if (openaiModelDraft == null) return;
								if (openaiModelDraft.trim() === openaiModel) {
									setOpenaiModelDraft(null);
									return;
								}
								setOpenAI({ model: openaiModelDraft });
								setOpenaiModelDraft(null);
							}}
							placeholder="gpt-4o-mini"
						/>
					</>
				) : (
					<>
						<Input
							label="Gemini API key"
							type="password"
							autoComplete="new-password"
							name="gemini-api-key"
							value={geminiKeyDraft != null ? geminiKeyDraft : geminiApiKey}
							onChange={(e) => setGeminiKeyDraft(e.target.value)}
							onBlur={() => {
								if (geminiKeyDraft == null) return;
								if (geminiKeyDraft === geminiApiKey) {
									setGeminiKeyDraft(null);
									return;
								}
								setGemini({ apiKey: geminiKeyDraft });
								setGeminiKeyDraft(null);
							}}
							placeholder="AIza…"
						/>
						<Input
							label="Gemini model"
							value={geminiModelDraft != null ? geminiModelDraft : geminiModel}
							onChange={(e) => setGeminiModelDraft(e.target.value)}
							onBlur={() => {
								if (geminiModelDraft == null) return;
								if (geminiModelDraft.trim() === geminiModel) {
									setGeminiModelDraft(null);
									return;
								}
								setGemini({ model: geminiModelDraft });
								setGeminiModelDraft(null);
							}}
							placeholder="gemini-3.5-flash"
						/>
					</>
				)}

				<Button
					type="button"
					variant="secondary"
					className="w-full"
					disabled={!openaiApiKey && !geminiApiKey}
					onClick={() => {
						clearKeys();
						setOpenaiKeyDraft(null);
						setGeminiKeyDraft(null);
						toast.success('Saved API keys cleared.');
					}}
				>
					Clear saved keys
				</Button>
			</CardBody>
		</Card>
	);
}
