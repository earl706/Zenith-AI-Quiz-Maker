import { useEffect, useMemo, useRef, useState } from 'react';
import {
	Camera,
	Check,
	ChevronLeft,
	ChevronRight,
	Images,
	ListOrdered,
	Plus,
	ScanLine,
	Sigma,
	Type,
	X
} from 'lucide-react';

import { getCroppedImageFile } from '../../lib/cropImage';
import { cn } from '../../lib/format';
import { MAX_BULK_IMAGES, bulkScanImageToData } from '../../lib/imageToData';
import { toast } from '../../stores/toastStore';
import MathInput from '../quiz/MathInput';
import WrappingTextInput from '../quiz/WrappingTextInput';
import { IconToggleButton } from '../quiz/quizAuthoringUi';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Input,
	LoadingScreen,
	Modal,
	Select,
	Textarea
} from '../ui';
import { ImageCropper } from './ImageCropper';

const ACCEPT_IMAGES = 'image/jpeg,image/png,image/webp,image/*';

function newId(prefix = 'id') {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function useObjectUrl(blob) {
	const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
	useEffect(
		() => () => {
			if (url) URL.revokeObjectURL(url);
		},
		[url]
	);
	return url;
}

async function prepareImageFile(originalFile, croppedAreaPixels) {
	if (!croppedAreaPixels) return originalFile;
	const url = URL.createObjectURL(originalFile);
	try {
		return await getCroppedImageFile(url, croppedAreaPixels, originalFile);
	} finally {
		URL.revokeObjectURL(url);
	}
}

function getAtPath(obj, path) {
	if (!path) return obj;
	return String(path)
		.split('.')
		.reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function setAtPath(obj, path, value) {
	const keys = String(path).split('.');
	if (keys.length === 1) return { ...obj, [keys[0]]: value };
	const next = { ...obj };
	let cursor = next;
	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		cursor[key] = Array.isArray(cursor[key]) ? [...cursor[key]] : { ...(cursor[key] || {}) };
		cursor = cursor[key];
	}
	cursor[keys[keys.length - 1]] = value;
	return next;
}

function normalizeRecords(data, recordsPath) {
	const raw = recordsPath ? getAtPath(data, recordsPath) : [data];
	const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
	return list.map((row, index) => ({
		_key: newId(`row-${index}`),
		...(row && typeof row === 'object' ? row : { value: row })
	}));
}

function recordsToData(records, recordsPath, baseData) {
	const clean = records.map(({ _key, ...rest }) => rest);
	if (!recordsPath) return clean[0] || {};
	return setAtPath(baseData || {}, recordsPath, clean);
}

function StepperNav({ index, count, label, onPrev, onNext, disabled }) {
	if (count <= 1) return null;
	return (
		<div className="flex items-center gap-2">
			<Button
				variant="secondary"
				size="icon"
				className="h-11 w-11 shrink-0 md:h-8 md:w-8"
				disabled={index <= 0 || disabled}
				onClick={onPrev}
				aria-label="Previous"
			>
				<ChevronLeft size={18} />
			</Button>
			<span className="text-muted min-w-0 flex-1 text-center text-xs leading-snug tabular-nums md:text-sm">
				{label}
			</span>
			<Button
				variant="secondary"
				size="icon"
				className="h-11 w-11 shrink-0 md:h-8 md:w-8"
				disabled={index >= count - 1 || disabled}
				onClick={onNext}
				aria-label="Next"
			>
				<ChevronRight size={18} />
			</Button>
		</div>
	);
}

function PreviewThumb({ src, alt }) {
	if (!src) return null;
	return (
		<div className="bg-surface-2 flex justify-center rounded-md p-1.5 md:p-3">
			<img
				src={src}
				alt={alt}
				className="max-h-24 w-auto max-w-full rounded-sm object-contain md:max-h-40"
			/>
		</div>
	);
}

function FieldEditor({ field, value, onChange, disabled }) {
	const id = `itd-${field.key}`;
	if (field.type === 'textarea') {
		return (
			<Textarea
				id={id}
				label={field.label}
				value={value ?? ''}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				placeholder={field.placeholder}
			/>
		);
	}
	if (field.type === 'select') {
		return (
			<Select
				id={id}
				label={field.label}
				value={value ?? ''}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
			>
				{(field.options || []).map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</Select>
		);
	}
	return (
		<Input
			id={id}
			label={field.label}
			type={field.type === 'number' ? 'number' : 'text'}
			value={value ?? ''}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
			placeholder={field.placeholder}
			autoComplete="off"
		/>
	);
}

function fieldKeys(fields) {
	return new Set((fields || []).map((f) => f.key));
}

function isQuizQuestionFields(fields) {
	const keys = fieldKeys(fields);
	return keys.has('title') && keys.has('kind') && keys.has('choicesText');
}

function linesFromChoicesText(text) {
	return String(text || '')
		.split(/\r?\n/)
		.map((line) => line.trimEnd());
}

function choicesTextFromLines(lines) {
	return lines.map((line) => String(line ?? '')).join('\n');
}

function ensureMcChoices(lines) {
	const next = lines.map((line) => String(line ?? ''));
	while (next.length < 4) next.push('');
	return next.slice(0, Math.max(4, next.length));
}

function CorrectMark({ active, onClick, disabled, label }) {
	return (
		<button
			type="button"
			aria-label={label}
			disabled={disabled}
			onClick={onClick}
			className={cn(
				'mt-2 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition',
				active ? 'border-primary bg-primary' : 'border-line bg-surface',
				disabled && 'cursor-not-allowed opacity-50'
			)}
		>
			{active && <Check size={10} className="text-primary-fg" />}
		</button>
	);
}

/** Create Quiz–style card for a scanned question row (title / kind / choicesText). */
function QuizQuestionDraftCard({ row, index, onChange, onRemove, disabled, canRemove }) {
	const kind = String(row.kind || 'mc').toLowerCase();
	const identification = kind === 'identification';
	const sequence = kind === 'sequence';
	const mathematical = row.mathematical === true || row.mathematical === 'true';
	const correctAnswerIndex = Number(row.correctAnswerIndex) || 0;
	const rawLines = linesFromChoicesText(row.choicesText);
	const choiceLines = sequence
		? rawLines.length
			? rawLines
			: ['', '']
		: identification
			? [rawLines[0] || '']
			: ensureMcChoices(rawLines);

	const patch = (partial) => onChange({ ...row, ...partial });

	const setKind = (nextKind) => {
		let nextLines = choiceLines;
		if (nextKind === 'identification') nextLines = [choiceLines[0] || ''];
		else if (nextKind === 'mc') nextLines = ensureMcChoices(choiceLines);
		else if (nextKind === 'sequence' && nextLines.length < 2) nextLines = [...nextLines, ''];
		patch({
			kind: nextKind,
			choicesText: choicesTextFromLines(nextLines),
			correctAnswerIndex: nextKind === 'mc' ? Math.min(correctAnswerIndex, 3) : 0
		});
	};

	const setChoice = (choiceIndex, value) => {
		const next = [...choiceLines];
		next[choiceIndex] = value;
		patch({ choicesText: choicesTextFromLines(next) });
	};

	const removeChoiceAt = (choiceIndex) => {
		if (identification || sequence) return;
		if (choiceLines.length <= 2) return;
		const next = choiceLines.filter((_, i) => i !== choiceIndex);
		const nextCorrect =
			correctAnswerIndex === choiceIndex
				? 0
				: correctAnswerIndex > choiceIndex
					? correctAnswerIndex - 1
					: correctAnswerIndex;
		patch({
			choicesText: choicesTextFromLines(ensureMcChoices(next)),
			correctAnswerIndex: nextCorrect
		});
	};

	const addChoice = () => {
		if (identification) return;
		patch({ choicesText: choicesTextFromLines([...choiceLines, '']) });
	};

	const mathQuestion = {
		id: row._key,
		identification,
		mathematical: true,
		correctAnswerIndex,
		choices: identification ? [choiceLines[0] || ''] : ensureMcChoices(choiceLines)
	};

	return (
		<Card className="overflow-hidden">
			<CardHeader
				className="px-4 py-3"
				title={`Q${index + 1}`}
				action={
					<div className="flex items-center gap-1.5">
						<div className="flex items-center gap-1">
							<IconToggleButton
								active={mathematical}
								label="Math"
								icon={Sigma}
								disabled={disabled}
								onClick={() => patch({ mathematical: mathematical ? 'false' : 'true' })}
							/>
							<IconToggleButton
								active={sequence}
								label="Sequence"
								icon={ListOrdered}
								disabled={disabled}
								onClick={() => setKind(sequence ? 'mc' : 'sequence')}
							/>
							{!sequence && (
								<IconToggleButton
									active={identification}
									label="Identification"
									icon={Type}
									disabled={disabled}
									onClick={() => setKind(identification ? 'mc' : 'identification')}
								/>
							)}
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label={`Remove question ${index + 1}`}
							disabled={disabled || !canRemove}
							onClick={onRemove}
						>
							<X size={15} />
						</Button>
					</div>
				}
			/>
			<CardBody className="space-y-3 px-4 pb-4">
				<WrappingTextInput
					value={row.title || ''}
					onChange={(e) => patch({ title: e.target.value })}
					placeholder={sequence ? 'Question text (use {{1}}, {{2}} for items)' : 'Question text'}
					disabled={disabled}
					className="border-line bg-surface text-fg focus:border-primary w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none"
				/>

				<div className="space-y-1.5">
					{sequence ? (
						<>
							<div className="flex flex-wrap gap-1.5">
								<select
									value={row.sequenceMode || 'gap'}
									onChange={(e) => patch({ sequenceMode: e.target.value })}
									disabled={disabled}
									className="border-line bg-surface text-fg rounded-md border px-2 py-1 text-xs"
								>
									<option value="full">Full list</option>
									<option value="gap">Gap fill</option>
									<option value="next">Next step</option>
								</select>
							</div>
							{choiceLines.map((line, ci) => (
								<WrappingTextInput
									key={ci}
									value={line}
									onChange={(e) => setChoice(ci, e.target.value)}
									placeholder={`Item ${ci + 1}`}
									disabled={disabled}
									className="border-line bg-surface text-fg focus:border-primary w-full rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
								/>
							))}
						</>
					) : mathematical ? (
						<MathInput
							question={mathQuestion}
							handleInputChange={(_id, field, value) => {
								if (field === 'correctAnswerIndex') patch({ correctAnswerIndex: value });
							}}
							handleChoicesChange={(_id, choiceIndex, value) => setChoice(choiceIndex, value)}
							removeChoice={(_id, choiceIndex) => removeChoiceAt(choiceIndex)}
						/>
					) : identification ? (
						<div className="flex items-start gap-2">
							<CorrectMark
								active={correctAnswerIndex === 0}
								disabled={disabled}
								label="Mark as correct"
								onClick={() => patch({ correctAnswerIndex: 0 })}
							/>
							<WrappingTextInput
								value={choiceLines[0] || ''}
								onChange={(e) => setChoice(0, e.target.value)}
								placeholder="Answer"
								plainIde
								disabled={disabled}
								className="border-line bg-surface text-fg focus:border-primary flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
							/>
						</div>
					) : (
						choiceLines.map((choice, ci) => (
							<div className="flex items-start gap-1.5" key={ci}>
								<CorrectMark
									active={correctAnswerIndex === ci}
									disabled={disabled}
									label={`Mark choice ${ci + 1} correct`}
									onClick={() => patch({ correctAnswerIndex: ci })}
								/>
								<WrappingTextInput
									value={choice}
									onChange={(e) => setChoice(ci, e.target.value)}
									placeholder={`Choice ${ci + 1}`}
									disabled={disabled}
									className="border-line bg-surface text-fg focus:border-primary min-w-0 flex-1 rounded-md border px-2.5 py-1.5 text-sm focus:outline-none"
								/>
								{!disabled && choiceLines.length > 2 && (
									<Button
										variant="ghost"
										size="icon"
										className="mt-0.5 h-7 w-7 shrink-0 cursor-pointer"
										aria-label={`Remove choice ${ci + 1}`}
										onClick={() => removeChoiceAt(ci)}
									>
										<X size={13} className="text-danger" />
									</Button>
								)}
							</div>
						))
					)}
				</div>

				{!identification && !disabled && (
					<Button variant="ghost" size="sm" className="w-full" onClick={addChoice}>
						<Plus size={13} /> {sequence ? 'Add item' : 'Add choice'}
					</Button>
				)}

				<details className="border-line rounded-md border p-3">
					<summary className="text-muted cursor-pointer text-xs font-semibold">
						Teaching content
					</summary>
					<div className="mt-3 space-y-3">
						<Textarea
							label="Explanation"
							rows={3}
							value={row.explanation || ''}
							onChange={(e) => patch({ explanation: e.target.value })}
							disabled={disabled}
						/>
						<Input
							label="Section title"
							value={row.sectionTitle || ''}
							onChange={(e) => patch({ sectionTitle: e.target.value })}
							disabled={disabled}
							placeholder="Optional"
						/>
					</div>
				</details>
			</CardBody>
		</Card>
	);
}

function DraftRecordEditor({
	draft,
	previewUrl,
	fields,
	recordsPath,
	onPatch,
	onRemove,
	importing,
	showRemove
}) {
	const records = draft.records || [];
	const quizLayout = isQuizQuestionFields(fields);

	const updateRecord = (key, fieldKey, value) => {
		onPatch({
			records: records.map((row) => (row._key === key ? { ...row, [fieldKey]: value } : row))
		});
	};

	const replaceRecord = (key, nextRow) => {
		onPatch({
			records: records.map((row) => (row._key === key ? nextRow : row))
		});
	};

	const removeRecord = (key) => {
		onPatch({ records: records.filter((row) => row._key !== key) });
	};

	const addRecord = () => {
		const blank = { _key: newId('row') };
		for (const field of fields) {
			blank[field.key] =
				field.defaultValue ?? (field.type === 'select' ? field.options?.[0]?.value || '' : '');
		}
		if (quizLayout) {
			blank.title = blank.title || '';
			blank.kind = blank.kind || 'mc';
			blank.choicesText = blank.choicesText || '\n\n\n';
			blank.correctAnswerIndex = blank.correctAnswerIndex ?? 0;
			blank.mathematical = blank.mathematical || 'false';
			blank.explanation = blank.explanation || '';
			blank.sectionTitle = blank.sectionTitle || '';
			blank.sequenceMode = blank.sequenceMode || 'gap';
		}
		onPatch({ records: [...records, blank] });
	};

	return (
		<div className="space-y-4 pb-1">
			<PreviewThumb src={previewUrl} alt="Scanned image" />
			{!recordsPath && records[0] ? (
				<div className="space-y-3">
					{fields.map((field) => (
						<FieldEditor
							key={field.key}
							field={field}
							value={records[0][field.key]}
							onChange={(v) => updateRecord(records[0]._key, field.key, v)}
							disabled={importing}
						/>
					))}
				</div>
			) : quizLayout ? (
				<div className="space-y-3">
					{records.map((row, index) => (
						<QuizQuestionDraftCard
							key={row._key}
							row={row}
							index={index}
							disabled={importing}
							canRemove={records.length > 1}
							onChange={(next) => replaceRecord(row._key, next)}
							onRemove={() => removeRecord(row._key)}
						/>
					))}
					<Button
						variant="ghost"
						size="sm"
						className="w-full"
						onClick={addRecord}
						disabled={importing}
					>
						<Plus size={13} /> Add question
					</Button>
				</div>
			) : (
				<ul className="space-y-3">
					{records.map((row, index) => (
						<li key={row._key}>
							<Card className="overflow-hidden">
								<CardHeader
									className="px-4 py-3"
									title={`Record ${index + 1}`}
									action={
										<Button
											variant="ghost"
											size="icon"
											className="cursor-pointer"
											onClick={() => removeRecord(row._key)}
											disabled={importing || records.length <= 1}
											aria-label="Remove record"
										>
											<X size={15} />
										</Button>
									}
								/>
								<CardBody className="space-y-2.5 px-4 pb-4">
									{fields.map((field) => (
										<FieldEditor
											key={field.key}
											field={field}
											value={row[field.key]}
											onChange={(v) => updateRecord(row._key, field.key, v)}
											disabled={importing}
										/>
									))}
								</CardBody>
							</Card>
						</li>
					))}
					<Button variant="secondary" size="sm" onClick={addRecord} disabled={importing}>
						Add record
					</Button>
				</ul>
			)}
			{showRemove && (
				<Button
					variant="ghost"
					size="sm"
					className="h-11 w-full md:h-8 md:w-auto"
					onClick={onRemove}
					disabled={importing}
				>
					Remove this image from batch
				</Button>
			)}
		</div>
	);
}

/**
 * Schema-driven image → structured data wizard.
 * Pick → crop → analyze → review → onCommit(drafts) (app owns persistence).
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.prompt
 * @param {object} [props.jsonSchema]
 * @param {Array<{key,label,type,options?,required?,defaultValue?}>} props.fields
 * @param {string} [props.recordsPath]  e.g. "items" for { items: [...] }
 * @param {(drafts: {id,file,data}[]) => Promise<void>|void} props.onCommit
 * @param {string} [props.title]
 * @param {string} [props.emptyTitle]
 * @param {string} [props.emptyDescription]
 * @param {number} [props.maxImages]
 * @param {(draft) => string|null} [props.validateDraft]
 */
export function ImageToDataPipeline({
	open,
	onClose,
	prompt,
	jsonSchema = null,
	fields = [],
	recordsPath = null,
	onCommit,
	title = 'Scan image',
	emptyTitle = 'Scan images',
	emptyDescription = 'Choose photos, crop if needed, then analyze into structured data.',
	maxImages = MAX_BULK_IMAGES,
	validateDraft = null,
	commitLabel = null,
	controls = null,
	/** Optional override: (draftData, recordsPath) => review records[] */
	normalizeRecordsFn = null
}) {
	const toRecords = normalizeRecordsFn || normalizeRecords;
	const fileRef = useRef(null);
	const cameraRef = useRef(null);
	const [analyzing, setAnalyzing] = useState(false);
	const [analyzeLabel, setAnalyzeLabel] = useState('');
	const [importing, setImporting] = useState(false);
	const [images, setImages] = useState([]);
	const [cropIndex, setCropIndex] = useState(0);
	const [cropLocked, setCropLocked] = useState(false);
	const [drafts, setDrafts] = useState([]);
	const [failures, setFailures] = useState([]);
	const [reviewIndex, setReviewIndex] = useState(0);

	const currentImage = images[cropIndex] || null;
	const sourceUrl = useObjectUrl(currentImage?.file);
	const currentDraft = drafts[reviewIndex] || null;
	const previewUrl = useObjectUrl(currentDraft?.file);

	const reset = () => {
		setImages([]);
		setCropIndex(0);
		setCropLocked(false);
		setDrafts([]);
		setFailures([]);
		setReviewIndex(0);
		setAnalyzeLabel('');
	};

	const handleClose = () => {
		if (analyzing || importing) return;
		reset();
		onClose();
	};

	const handlePickFile = () => fileRef.current?.click();
	const handleTakePhoto = () => cameraRef.current?.click();

	const enqueueFiles = (fileList) => {
		if (cropLocked) return;
		const picked = Array.from(fileList || []).filter(Boolean);
		if (!picked.length) return;

		const room = maxImages - images.length;
		if (room <= 0) {
			toast.error(`You can scan at most ${maxImages} images.`);
			return;
		}
		const take = picked.slice(0, room);
		if (picked.length > take.length) {
			toast.error(`Only ${room} more image(s) allowed (max ${maxImages}).`);
		}

		const next = take.map((file) => ({
			id: newId('img'),
			file,
			croppedAreaPixels: null
		}));
		const startIndex = images.length;
		setImages((prev) => [...prev, ...next]);
		setCropIndex(startIndex);
	};

	const handleFile = (event) => {
		const picked = Array.from(event.target.files || []);
		event.target.value = '';
		enqueueFiles(picked);
	};

	const updateCurrentCrop = (pixels) => {
		if (!currentImage || cropLocked) return;
		setImages((prev) =>
			prev.map((img, i) => (i === cropIndex ? { ...img, croppedAreaPixels: pixels } : img))
		);
	};

	const removeCurrentImage = () => {
		if (cropLocked || images.length <= 1) {
			if (images.length <= 1) reset();
			return;
		}
		const next = images.filter((_, i) => i !== cropIndex);
		setImages(next);
		setCropIndex((i) => Math.min(i, next.length - 1));
	};

	const applyScanResults = (preparedFiles, meta, scanData, { appendDrafts = false } = {}) => {
		const byIndex = new Map((scanData?.results || []).map((r) => [r.index, r]));
		const nextDrafts = [];
		const nextFailures = [];

		preparedFiles.forEach((file, index) => {
			const row = byIndex.get(index);
			const name = meta[index]?.name || file.name || `Image ${index + 1}`;
			const failureId = meta[index]?.id || newId('fail');
			if (!row || !row.ok || !row.draft) {
				nextFailures.push({
					id: failureId,
					name,
					file,
					detail: row?.detail || 'Could not analyze image.'
				});
				return;
			}
			nextDrafts.push({
				id: newId('draft'),
				file,
				raw: row.draft,
				records: toRecords(row.draft, recordsPath)
			});
		});

		if (appendDrafts) {
			setDrafts((prev) => [...prev, ...nextDrafts]);
		} else {
			setDrafts(nextDrafts);
			setReviewIndex(0);
		}
		setFailures(nextFailures);

		if (nextDrafts.length && nextFailures.length) {
			toast.success(`Analyzed ${nextDrafts.length}; ${nextFailures.length} failed — retry below.`);
		} else if (nextDrafts.length) {
			toast.success(
				nextDrafts.length === 1
					? 'Ready to review 1 image.'
					: `Ready to review ${nextDrafts.length} images.`
			);
		} else if (nextFailures.length) {
			toast.error('No images could be analyzed. Retry or start over.');
		}
	};

	const handleAnalyzeAll = async () => {
		if (!images.length) {
			toast.error('Choose at least one image.');
			return;
		}
		if (!prompt?.trim()) {
			toast.error('A prompt is required.');
			return;
		}

		setAnalyzing(true);
		setAnalyzeLabel(`Preparing ${images.length} image(s)…`);
		setCropLocked(true);
		try {
			const prepared = [];
			const meta = [];
			for (let i = 0; i < images.length; i++) {
				setAnalyzeLabel(`Preparing ${i + 1} of ${images.length}…`);
				const img = images[i];
				prepared.push(await prepareImageFile(img.file, img.croppedAreaPixels));
				meta.push({ id: img.id, name: img.file.name || `Image ${i + 1}` });
			}
			setAnalyzeLabel(`Analyzing ${prepared.length} image(s)…`);
			const scanData = await bulkScanImageToData(prepared, { prompt, jsonSchema });
			applyScanResults(prepared, meta, scanData);
			setImages([]);
		} catch (err) {
			setCropLocked(false);
			const detail = err?.response?.data?.detail || err?.response?.data?.images;
			toast.error(
				(typeof detail === 'string' && detail) || err?.message || 'Could not analyze images.'
			);
		} finally {
			setAnalyzing(false);
			setAnalyzeLabel('');
		}
	};

	const handleRetryFailures = async () => {
		if (!failures.length) return;
		setAnalyzing(true);
		setAnalyzeLabel(`Retrying ${failures.length} image(s)…`);
		try {
			const prepared = failures.map((f) => f.file);
			const meta = failures.map((f) => ({ id: f.id, name: f.name }));
			const scanData = await bulkScanImageToData(prepared, { prompt, jsonSchema });
			applyScanResults(prepared, meta, scanData, { appendDrafts: true });
		} catch (err) {
			const detail = err?.response?.data?.detail;
			toast.error(detail || err?.message || 'Retry failed.');
		} finally {
			setAnalyzing(false);
			setAnalyzeLabel('');
		}
	};

	const dismissFailure = (id) => {
		setFailures((prev) => prev.filter((f) => f.id !== id));
	};

	const patchDraft = (id, patch) => {
		setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
	};

	const removeDraft = (id) => {
		const idx = drafts.findIndex((d) => d.id === id);
		const next = drafts.filter((d) => d.id !== id);
		setDrafts(next);
		if (!next.length) {
			setReviewIndex(0);
			return;
		}
		if (idx < 0) {
			setReviewIndex(Math.min(reviewIndex, next.length - 1));
			return;
		}
		if (reviewIndex > idx) setReviewIndex(reviewIndex - 1);
		else setReviewIndex(Math.min(reviewIndex, next.length - 1));
	};

	const defaultValidate = (draft) => {
		const records = draft.records || [];
		if (!records.length) return 'Add at least one record.';
		for (const field of fields) {
			if (!field.required) continue;
			for (const row of records) {
				const value = row[field.key];
				if (value == null || String(value).trim() === '') {
					return `${field.label} is required on every record.`;
				}
			}
		}
		return null;
	};

	const handleCommitAll = async () => {
		if (!drafts.length) {
			toast.error('Analyze at least one image first.');
			return;
		}
		const validator = validateDraft || defaultValidate;
		for (let i = 0; i < drafts.length; i++) {
			const err = validator(drafts[i]);
			if (err) {
				setReviewIndex(i);
				toast.error(err);
				return;
			}
		}

		setImporting(true);
		try {
			const payload = drafts.map((draft) => ({
				id: draft.id,
				file: draft.file,
				data: recordsToData(draft.records, recordsPath, draft.raw)
			}));
			await onCommit?.(payload);
			reset();
			onClose();
		} catch (err) {
			const detail = err?.response?.data?.detail || err?.message;
			toast.error((typeof detail === 'string' && detail) || 'Could not save scanned data.');
		} finally {
			setImporting(false);
		}
	};

	const cropping = images.length > 0 && !cropLocked && !analyzing;
	const reviewing = drafts.length > 0 && !analyzing;
	const failuresOnly = cropLocked && !drafts.length && failures.length > 0 && !analyzing;

	const modalTitle = analyzing
		? 'Analyzing…'
		: cropping
			? images.length > 1
				? `Crop image ${cropIndex + 1} of ${images.length}`
				: 'Crop image'
			: reviewing
				? drafts.length > 1
					? `Review ${reviewIndex + 1} of ${drafts.length}`
					: title
				: failuresOnly
					? 'Scan failed'
					: title;

	const resolvedCommitLabel =
		commitLabel ||
		(drafts.length === 1 ? 'Save' : drafts.length > 1 ? `Save all ${drafts.length}` : 'Save');

	return (
		<Modal
			open={open}
			onClose={handleClose}
			title={modalTitle}
			size="2xl"
			footer={
				<>
					<Button variant="secondary" onClick={handleClose} disabled={analyzing || importing}>
						Cancel
					</Button>
					{analyzing ? (
						<Button loading disabled>
							{analyzeLabel || 'Analyzing…'}
						</Button>
					) : reviewing ? (
						<Button loading={importing} onClick={handleCommitAll}>
							{resolvedCommitLabel}
						</Button>
					) : cropping ? (
						<Button loading={analyzing} onClick={handleAnalyzeAll}>
							<ScanLine size={16} />
							{images.length === 1 ? 'Analyze image' : `Analyze all ${images.length}`}
						</Button>
					) : failuresOnly ? (
						<Button loading={analyzing} onClick={handleRetryFailures}>
							Retry failed
						</Button>
					) : (
						<Button className="max-sm:hidden!" loading={analyzing} onClick={handlePickFile}>
							<ScanLine size={16} /> Choose images
						</Button>
					)}
				</>
			}
		>
			<input
				ref={fileRef}
				type="file"
				accept={ACCEPT_IMAGES}
				multiple
				className="hidden"
				onChange={handleFile}
			/>
			<input
				ref={cameraRef}
				type="file"
				accept="image/*"
				capture="environment"
				className="hidden"
				onChange={handleFile}
			/>

			{analyzing ? (
				<div className="space-y-3">
					<LoadingScreen label={analyzeLabel || 'Analyzing…'} />
				</div>
			) : cropping && currentImage ? (
				<div className="space-y-3">
					{controls}
					<StepperNav
						index={cropIndex}
						count={images.length}
						label={`Image ${cropIndex + 1} of ${images.length}${
							currentImage.croppedAreaPixels ? ' · Cropped' : ' · Full image OK'
						}`}
						onPrev={() => setCropIndex((i) => Math.max(0, i - 1))}
						onNext={() => setCropIndex((i) => Math.min(images.length - 1, i + 1))}
					/>

					{sourceUrl ? (
						<ImageCropper
							key={currentImage.id}
							imageSrc={sourceUrl}
							initialCorners={currentImage.croppedAreaPixels?.corners || null}
							onCropPixelsChange={updateCurrentCrop}
							className="h-[min(58dvh,28rem)] md:h-[min(52vh,28rem)]"
						/>
					) : (
						<LoadingScreen label="Loading image…" />
					)}
					<div className="flex flex-col gap-2 md:flex-row md:flex-wrap">
						{images.length < maxImages && (
							<>
								<Button
									variant="secondary"
									size="sm"
									className="h-11 w-full md:hidden"
									onClick={handleTakePhoto}
								>
									<Camera size={16} /> Take photo
								</Button>
								<Button
									variant="secondary"
									size="sm"
									className="h-11 w-full md:h-8 md:w-auto"
									onClick={handlePickFile}
								>
									<Images size={16} />
									<span className="md:hidden">Photo library</span>
									<span className="hidden md:inline">Add images</span>
								</Button>
							</>
						)}
						<Button
							variant="ghost"
							size="sm"
							className="h-11 w-full md:h-8 md:w-auto"
							onClick={removeCurrentImage}
						>
							{images.length === 1 ? 'Clear' : 'Remove this image'}
						</Button>
					</div>
				</div>
			) : reviewing || failuresOnly ? (
				<div className="space-y-4">
					{failures.length > 0 && (
						<div className="border-danger/40 bg-danger/5 space-y-2 rounded-md border p-3">
							<p className="text-fg text-sm font-medium">
								{failures.length === 1
									? '1 image failed analysis'
									: `${failures.length} images failed analysis`}
							</p>
							<ul className="text-muted space-y-2 text-sm">
								{failures.map((f) => (
									<li
										key={f.id}
										className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2"
									>
										<span className="min-w-0 break-words">
											<span className="text-fg">{f.name}</span> — {f.detail}
										</span>
										<Button
											variant="ghost"
											size="sm"
											className="self-end sm:self-start"
											onClick={() => dismissFailure(f.id)}
											disabled={importing || analyzing}
										>
											Dismiss
										</Button>
									</li>
								))}
							</ul>
							<Button
								variant="secondary"
								size="sm"
								className="h-11 w-full md:h-8 md:w-auto"
								loading={analyzing}
								onClick={handleRetryFailures}
								disabled={importing}
							>
								Retry failed
							</Button>
						</div>
					)}

					{reviewing && currentDraft ? (
						<>
							<StepperNav
								index={reviewIndex}
								count={drafts.length}
								label={`Image ${reviewIndex + 1} of ${drafts.length}`}
								disabled={importing}
								onPrev={() => setReviewIndex((i) => Math.max(0, i - 1))}
								onNext={() => setReviewIndex((i) => Math.min(drafts.length - 1, i + 1))}
							/>
							<DraftRecordEditor
								draft={currentDraft}
								previewUrl={previewUrl}
								fields={fields}
								recordsPath={recordsPath}
								onPatch={(patch) => patchDraft(currentDraft.id, patch)}
								onRemove={() => removeDraft(currentDraft.id)}
								importing={importing}
								showRemove={drafts.length > 1}
							/>
							{drafts.length === 1 && (
								<Button
									variant="ghost"
									size="sm"
									className="h-11 w-full md:h-8 md:w-auto"
									onClick={() => removeDraft(currentDraft.id)}
									disabled={importing}
								>
									Discard
								</Button>
							)}
						</>
					) : null}
				</div>
			) : (
				<div className="border-line flex flex-col items-center gap-3 rounded-md border border-dashed px-4 py-8 text-center md:p-10">
					{controls ? <div className="w-full max-w-2xl text-left">{controls}</div> : null}
					<div className="bg-surface-2 text-muted flex h-12 w-12 items-center justify-center rounded-sm">
						<ScanLine size={22} />
					</div>
					<div>
						<p className="text-fg font-medium">{emptyTitle}</p>
						<p className="text-muted mt-1 text-sm">
							{emptyDescription} Up to {maxImages} images per batch.
						</p>
					</div>
					<div className="flex w-full max-w-sm flex-col gap-2">
						<Button className="h-12 w-full md:hidden" onClick={handleTakePhoto}>
							<Camera size={16} /> Take photo
						</Button>
						<Button variant="secondary" className="h-12 w-full" onClick={handlePickFile}>
							<Images size={16} />
							<span className="md:hidden">Photo library</span>
							<span className="hidden md:inline">Choose images</span>
						</Button>
					</div>
				</div>
			)}
		</Modal>
	);
}
