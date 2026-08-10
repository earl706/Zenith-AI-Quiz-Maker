import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
	buildCapacityPayload,
	DEFAULT_ESTIMATED_MINUTES,
	DEFAULT_HOURS_PER_DAY,
	DEFAULT_HOURS_PER_WEEK,
	DEFAULT_STUDY_DAYS,
	toastIfDeadlineExtended
} from '../../lib/roadmapCapacity';
import { useForkRoadmapFromQuiz } from '../../lib/studyResources';
import { toast } from '../../stores/toastStore';
import { Button, Input, Modal, Select } from '../ui';
import RoadmapCapacityFields from './RoadmapCapacityFields';

/**
 * Create a mastery roadmap from an owner quiz (one node per section).
 * Pass `quiz` to lock to a single quiz (Quiz detail / list).
 * Pass `sources` for a picker (Roadmap page).
 * Optional `onCreated(roadmap)` runs after a successful fork (before navigate).
 */
export default function CreateRoadmapFromQuizModal({
	open,
	onClose,
	quiz = null,
	sources = [],
	navigateOnSuccess = false,
	onCreated
}) {
	const navigate = useNavigate();
	const fork = useForkRoadmapFromQuiz();
	const [quizUuid, setQuizUuid] = useState('');
	const [deadline, setDeadline] = useState('');
	const [title, setTitle] = useState('');
	const [hoursPerWeek, setHoursPerWeek] = useState(DEFAULT_HOURS_PER_WEEK);
	const [hoursPerDay, setHoursPerDay] = useState(DEFAULT_HOURS_PER_DAY);
	const [studyDays, setStudyDays] = useState(DEFAULT_STUDY_DAYS);
	const [defaultEstimatedMinutes, setDefaultEstimatedMinutes] = useState(DEFAULT_ESTIMATED_MINUTES);
	const [sectionEstimates, setSectionEstimates] = useState({});

	const locked = quiz != null;
	const options = locked
		? [
				{
					uuid: String(quiz.uuid || quiz.quiz_id || ''),
					title: quiz.quiz_title || 'Quiz',
					section_count: Array.isArray(quiz.sections) ? quiz.sections.length : quiz.section_count,
					sections: Array.isArray(quiz.sections) ? quiz.sections : [],
					default_mastery_attempts: 5,
					default_mastery_accuracy: 95
				}
			]
		: sources;

	const selected = options.find((o) => o.uuid === quizUuid) || (locked ? options[0] : null);
	const sections = selected?.sections || [];

	useEffect(() => {
		if (!open) return;
		setDeadline('');
		setTitle('');
		setHoursPerWeek(DEFAULT_HOURS_PER_WEEK);
		setHoursPerDay(DEFAULT_HOURS_PER_DAY);
		setStudyDays(DEFAULT_STUDY_DAYS);
		setDefaultEstimatedMinutes(DEFAULT_ESTIMATED_MINUTES);
		setSectionEstimates({});
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
				title: title || undefined,
				...buildCapacityPayload({
					hoursPerWeek,
					hoursPerDay,
					studyDays,
					defaultEstimatedMinutes,
					sectionEstimates,
					sections
				})
			},
			{
				onSuccess: (data) => {
					toast.success('Roadmap created from quiz.');
					toastIfDeadlineExtended(data, toast);
					onCreated?.(data);
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
				<RoadmapCapacityFields
					hoursPerWeek={hoursPerWeek}
					onHoursPerWeek={setHoursPerWeek}
					hoursPerDay={hoursPerDay}
					onHoursPerDay={setHoursPerDay}
					studyDays={studyDays}
					onStudyDays={setStudyDays}
					defaultEstimatedMinutes={defaultEstimatedMinutes}
					onDefaultEstimatedMinutes={setDefaultEstimatedMinutes}
					sectionEstimates={sectionEstimates}
					onSectionEstimate={(key, value) =>
						setSectionEstimates((prev) => ({ ...prev, [key]: value }))
					}
					sections={sections}
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
