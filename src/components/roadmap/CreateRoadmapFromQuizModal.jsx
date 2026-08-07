import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useForkRoadmapFromQuiz } from '../../lib/studyResources';
import { toast } from '../../stores/toastStore';
import { Button, Input, Modal, Select } from '../ui';

/**
 * Create a mastery roadmap from an owner quiz (one node per section).
 * Pass `quiz` to lock to a single quiz (Quiz detail / list).
 * Pass `sources` for a picker (Roadmap page).
 */
export default function CreateRoadmapFromQuizModal({
	open,
	onClose,
	quiz = null,
	sources = [],
	navigateOnSuccess = false
}) {
	const navigate = useNavigate();
	const fork = useForkRoadmapFromQuiz();
	const [quizUuid, setQuizUuid] = useState('');
	const [deadline, setDeadline] = useState('');
	const [title, setTitle] = useState('');

	const locked = quiz != null;
	const options = locked
		? [
				{
					uuid: String(quiz.uuid || quiz.quiz_id || ''),
					title: quiz.quiz_title || 'Quiz',
					section_count: Array.isArray(quiz.sections) ? quiz.sections.length : quiz.section_count,
					default_mastery_attempts: 5,
					default_mastery_accuracy: 95
				}
			]
		: sources;

	const selected = options.find((o) => o.uuid === quizUuid) || (locked ? options[0] : null);

	useEffect(() => {
		if (!open) return;
		setDeadline('');
		setTitle('');
		if (locked) {
			setQuizUuid(String(quiz.uuid || quiz.quiz_id || ''));
		} else {
			setQuizUuid('');
		}
	}, [open, locked, quiz]);

	const submit = () => {
		const uuid = quizUuid || selected?.uuid;
		if (!uuid) return;
		fork.mutate(
			{
				quiz_uuid: uuid,
				deadline: deadline || null,
				title: title || undefined
			},
			{
				onSuccess: () => {
					toast.success('Roadmap created from quiz.');
					onClose();
					if (navigateOnSuccess) navigate('/roadmap');
				},
				onError: (err) =>
					toast.error(err.response?.data?.detail || 'Could not create roadmap from quiz.')
			}
		);
	};

	const sectionHint = selected
		? `Creates a step per section (${selected.section_count || '—'}) with prerequisites in order. Mastery default: ${
				selected.default_mastery_attempts ?? 5
			}× ≥${selected.default_mastery_accuracy ?? 95}%.`
		: null;

	return (
		<Modal open={open} onClose={onClose} title="Create roadmap from quiz" size="lg">
			<div className="space-y-3">
				{locked ? (
					<p className="text-fg text-sm font-medium">{selected?.title}</p>
				) : (
					<Select label="Quiz" value={quizUuid} onChange={(e) => setQuizUuid(e.target.value)}>
						<option value="">Select a quiz with sections…</option>
						{options.map((q) => (
							<option key={q.uuid} value={q.uuid}>
								{q.title} ({q.section_count} sections)
							</option>
						))}
					</Select>
				)}
				{sectionHint && <p className="text-muted text-sm">{sectionHint}</p>}
				{!locked && options.length === 0 && (
					<p className="text-muted text-sm">
						No quizzes with sections yet. Add sections to a quiz, then create a roadmap.
					</p>
				)}
				<Input
					label="Custom title (optional)"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
				/>
				<Input
					label="Deadline"
					type="date"
					value={deadline}
					onChange={(e) => setDeadline(e.target.value)}
				/>
				<div className="flex justify-end gap-2 pt-2">
					<Button variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<Button
						onClick={submit}
						disabled={!selected?.uuid || fork.isPending}
						loading={fork.isPending}
					>
						Create roadmap
					</Button>
				</div>
			</div>
		</Modal>
	);
}
