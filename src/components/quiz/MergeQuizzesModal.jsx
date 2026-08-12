import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { post } from '../../lib/api';
import { queryClient } from '../../lib/queryClient';
import { invalidateQuizQueries } from '../../lib/resources';
import { toast } from '../../stores/toastStore';
import { Button, Modal, Select } from '../ui';

const ACTION_LABELS = {
	merge_into: 'Merge into existing section',
	keep_both: 'Keep both (new section title)',
	create: 'Add as new section',
	skip: 'Skip this section'
};

/**
 * Merge one or more source quizzes into a target.
 *
 * - `quizzes`: candidate list (usually selected rows or all owner quizzes)
 * - `initialTargetUuid` / `initialSourceUuid`: optional presets (detail page)
 */
export default function MergeQuizzesModal({
	open,
	onClose,
	quizzes = [],
	initialTargetUuid = null,
	initialSourceUuid = null,
	onMerged
}) {
	const options = useMemo(
		() =>
			(quizzes || [])
				.map((q) => ({
					uuid: String(q.uuid || q.quiz_id || ''),
					title: q.quiz_title || 'Untitled quiz',
					question_count:
						typeof q.question_count === 'number'
							? q.question_count
							: Array.isArray(q.questions)
								? q.questions.length
								: 0,
					section_count:
						typeof q.section_count === 'number'
							? q.section_count
							: Array.isArray(q.sections)
								? q.sections.length
								: 0
				}))
				.filter((q) => q.uuid),
		[quizzes]
	);

	const [targetUuid, setTargetUuid] = useState('');
	const [sourceUuid, setSourceUuid] = useState('');
	const [preview, setPreview] = useState(null);
	const [sectionActions, setSectionActions] = useState({});
	const [includeUnsectioned, setIncludeUnsectioned] = useState(true);

	useEffect(() => {
		if (!open) return;
		const sourcePref = initialSourceUuid ? String(initialSourceUuid) : '';
		const targetPref = initialTargetUuid ? String(initialTargetUuid) : '';

		let target =
			targetPref && options.some((o) => o.uuid === targetPref) ? targetPref : '';
		if (!target) {
			target =
				options.find((o) => o.uuid !== sourcePref)?.uuid || options[0]?.uuid || '';
		}

		const sourceCandidates = options.filter((o) => o.uuid !== target);
		const source =
			sourcePref && sourceCandidates.some((o) => o.uuid === sourcePref)
				? sourcePref
				: sourceCandidates[0]?.uuid || '';

		setTargetUuid(target);
		setSourceUuid(source);
		setPreview(null);
		setSectionActions({});
		setIncludeUnsectioned(true);
	}, [open, options, initialTargetUuid, initialSourceUuid]);

	const previewMutation = useMutation({
		mutationFn: () =>
			post('/quizzes/quiz/merge/', {
				action: 'preview',
				target_uuid: targetUuid,
				source_uuid: sourceUuid
			}),
		onSuccess: (data) => {
			setPreview(data);
			const next = {};
			for (const row of data.sections || []) {
				next[row.source_section_id] = row.default_action;
			}
			setSectionActions(next);
		},
		onError: (err) => {
			toast.error(err.response?.data?.error || 'Could not preview merge.');
			setPreview(null);
		}
	});

	const mergeMutation = useMutation({
		mutationFn: () =>
			post('/quizzes/quiz/merge/', {
				action: 'merge',
				target_uuid: targetUuid,
				source_uuid: sourceUuid,
				include_unsectioned: includeUnsectioned,
				section_actions: Object.entries(sectionActions).map(([source_section_id, action]) => ({
					source_section_id: Number(source_section_id),
					action
				}))
			}),
		onSuccess: async (data) => {
			await Promise.all([
				invalidateQuizQueries(),
				queryClient.invalidateQueries({ queryKey: ['roadmaps'] })
			]);
			toast.success(
				`Merged ${data.questions_added} question${data.questions_added === 1 ? '' : 's'}` +
					(data.attempts_moved
						? ` · moved ${data.attempts_moved} attempt${data.attempts_moved === 1 ? '' : 's'}`
						: '') +
					(data.roadmap_nodes_added
						? ` · added ${data.roadmap_nodes_added} roadmap node${data.roadmap_nodes_added === 1 ? '' : 's'}`
						: '')
			);
			onMerged?.(data);
			onClose?.();
		},
		onError: (err) => {
			toast.error(err.response?.data?.error || 'Could not merge quizzes.');
		}
	});

	const sourceOptions = options.filter((o) => o.uuid !== targetUuid);
	const canPreview = targetUuid && sourceUuid && targetUuid !== sourceUuid;
	const colliding = (preview?.sections || []).filter((s) => s.collision);

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Merge quizzes"
			size="xl"
			footer={
				<>
					<Button variant="secondary" onClick={onClose}>
						Cancel
					</Button>
					{!preview ? (
						<Button
							disabled={!canPreview}
							loading={previewMutation.isPending}
							onClick={() => previewMutation.mutate()}
						>
							Preview
						</Button>
					) : (
						<>
							<Button
								variant="secondary"
								onClick={() => {
									setPreview(null);
									setSectionActions({});
								}}
							>
								Back
							</Button>
							<Button loading={mergeMutation.isPending} onClick={() => mergeMutation.mutate()}>
								Merge into target
							</Button>
						</>
					)}
				</>
			}
		>
			<div className="space-y-4">
				<p className="text-muted text-sm leading-relaxed">
					Copy questions from the source into the target (skipping duplicates). Target settings and
					roadmap progress stay intact; source quiz is left in place; source attempts are reassigned
					to the target.
				</p>

				{!preview && (
					<div className="grid gap-3 sm:grid-cols-2">
						<Select
							label="Target (keep)"
							value={targetUuid}
							onChange={(e) => {
								const next = e.target.value;
								setTargetUuid(next);
								if (sourceUuid === next) {
									setSourceUuid(options.find((o) => o.uuid !== next)?.uuid || '');
								}
							}}
						>
							{options.map((o) => (
								<option key={o.uuid} value={o.uuid}>
									{o.title} ({o.question_count} Qs)
								</option>
							))}
						</Select>
						<Select
							label="Source (copy from)"
							value={sourceUuid}
							onChange={(e) => setSourceUuid(e.target.value)}
							disabled={sourceOptions.length === 0}
						>
							{sourceOptions.length === 0 ? (
								<option value="">No other quiz selected</option>
							) : (
								sourceOptions.map((o) => (
									<option key={o.uuid} value={o.uuid}>
										{o.title} ({o.question_count} Qs)
									</option>
								))
							)}
						</Select>
					</div>
				)}

				{preview && (
					<div className="space-y-4">
						<div className="border-line bg-surface-2 rounded-md border p-3 text-xs">
							<p className="text-fg font-medium">
								{preview.source?.quiz_title} → {preview.target?.quiz_title}
							</p>
							<p className="text-muted mt-1">
								Source keeps its copy · target settings preferred · target roadmaps only (
								{preview.target?.roadmap_count ?? 0}) · {preview.source?.attempts_count ?? 0}{' '}
								attempt
								{(preview.source?.attempts_count ?? 0) === 1 ? '' : 's'} will move
							</p>
						</div>

						{(preview.sections || []).length > 0 && (
							<ul className="space-y-3">
								{(preview.sections || []).map((row) => (
									<li key={row.source_section_id} className="border-line rounded-md border p-3">
										<div className="flex flex-wrap items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="text-fg text-sm font-medium">{row.source_title}</p>
												<p className="text-muted mt-0.5 text-xs">
													{row.new_question_count} new of {row.source_question_count} question
													{row.source_question_count === 1 ? '' : 's'}
													{row.collision ? ` · matches “${row.target_title}”` : ' · no title match'}
												</p>
											</div>
											{row.collision && (
												<span className="text-warning text-[10px] font-semibold tracking-wide uppercase">
													Ask
												</span>
											)}
										</div>
										{row.collision || row.allowed_actions?.length > 1 ? (
											<div className="mt-2">
												<Select
													label="Action"
													value={sectionActions[row.source_section_id] || row.default_action}
													onChange={(e) =>
														setSectionActions((prev) => ({
															...prev,
															[row.source_section_id]: e.target.value
														}))
													}
												>
													{(row.allowed_actions || []).map((action) => (
														<option key={action} value={action}>
															{ACTION_LABELS[action] || action}
														</option>
													))}
												</Select>
											</div>
										) : (
											<p className="text-muted mt-2 text-xs">
												Will add as a new section
												{row.new_question_count === 0 ? ' (no new questions)' : ''}.
											</p>
										)}
									</li>
								))}
							</ul>
						)}

						{colliding.length === 0 && (preview.sections || []).length > 0 && (
							<p className="text-muted text-xs">
								No colliding section titles — new sections will be appended.
							</p>
						)}

						{(preview.unsectioned?.source_question_count || 0) > 0 && (
							<label className="border-line flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm">
								<input
									type="checkbox"
									className="mt-0.5 accent-primary"
									checked={includeUnsectioned}
									onChange={(e) => setIncludeUnsectioned(e.target.checked)}
								/>
								<span>
									<span className="text-fg font-medium">Include unsectioned questions</span>
									<span className="text-muted mt-0.5 block text-xs">
										{preview.unsectioned.new_question_count} new of{' '}
										{preview.unsectioned.source_question_count}
									</span>
								</span>
							</label>
						)}
					</div>
				)}
			</div>
		</Modal>
	);
}
