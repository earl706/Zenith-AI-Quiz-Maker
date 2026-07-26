import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { api } from '../../lib/api';
import { Badge, Button, Modal, Select } from '../ui';

/**
 * Shared instruction modal for AI quiz revise (Create + Edit).
 */
export default function QuizAiInstructionModal({
	open,
	onClose,
	onSubmit,
	loading = false,
	initialModel = ''
}) {
	const [instruction, setInstruction] = useState('');
	const [ollamaModels, setOllamaModels] = useState([]);
	const [ollamaModel, setOllamaModel] = useState(initialModel || '');
	const [ollamaMode, setOllamaMode] = useState('local');
	const [modelsLoading, setModelsLoading] = useState(false);
	const [modelsError, setModelsError] = useState('');

	useEffect(() => {
		if (!open) return;
		let cancelled = false;
		(async () => {
			setModelsLoading(true);
			setModelsError('');
			setInstruction('');
			try {
				const { data } = await api.get('/quizzes/quiz/ollama/models/');
				if (cancelled) return;
				const models = Array.isArray(data?.models) ? data.models : [];
				const mode = data?.mode === 'cloud' ? 'cloud' : 'local';
				setOllamaMode(mode);
				setOllamaModels(models);
				const preferred =
					(initialModel && models.includes(initialModel) && initialModel) ||
					(data?.default && models.includes(data.default) && data.default) ||
					models[0] ||
					data?.default ||
					'';
				setOllamaModel(preferred);
				if (models.length === 0) {
					setModelsError(
						mode === 'cloud'
							? 'No free-tier Ollama Cloud models available.'
							: 'No Ollama models found. Pull a model locally.'
					);
				}
			} catch (error) {
				if (cancelled) return;
				setModelsError(error?.response?.data?.error || 'Cannot reach Ollama to list models.');
				setOllamaModels([]);
			} finally {
				if (!cancelled) setModelsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [open, initialModel]);

	const handleSubmit = async () => {
		const ok = await onSubmit?.(instruction.trim(), ollamaModel.trim());
		if (ok) onClose?.();
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Edit quiz with AI"
			size="md"
			footer={
				<Button
					variant="secondary"
					className="w-full cursor-pointer sm:w-auto"
					loading={loading}
					disabled={!instruction.trim() || !ollamaModel.trim() || loading || modelsLoading}
					onClick={handleSubmit}
				>
					{loading ? (
						'Working'
					) : (
						<>
							<Sparkles size={13} /> Apply instruction
						</>
					)}
				</Button>
			}
		>
			<div className="space-y-2.5">
				<div className="flex items-center gap-2">
					<Badge tone="primary">Ollama</Badge>
					<Badge tone={ollamaMode === 'cloud' ? 'primary' : 'default'}>
						{ollamaMode === 'cloud' ? 'Cloud' : 'Local'}
					</Badge>
					<span className="text-muted text-xs">Revise the current draft from an instruction</span>
				</div>

				<Select
					label={ollamaMode === 'cloud' ? 'Model (free tier)' : 'Model'}
					value={ollamaModel}
					disabled={modelsLoading || ollamaModels.length === 0}
					onChange={(e) => setOllamaModel(e.target.value)}
					error={modelsError || undefined}
					className="py-1.5"
				>
					{modelsLoading && <option value="">Loading…</option>}
					{!modelsLoading && ollamaModels.length === 0 && <option value="">No models</option>}
					{ollamaModels.map((name) => (
						<option key={name} value={name}>
							{name}
						</option>
					))}
				</Select>

				<label className="block">
					<span className="text-fg mb-1.5 block text-xs font-medium">Instruction</span>
					<textarea
						value={instruction}
						onChange={(e) => setInstruction(e.target.value)}
						placeholder='e.g. "Add 5 harder MCQs to Section 2" or "Split into 3 sections by topic"'
						rows={5}
						className="border-line bg-surface text-fg focus:border-primary w-full rounded-md border px-2.5 py-2 text-sm focus:outline-none"
					/>
				</label>
			</div>
		</Modal>
	);
}
