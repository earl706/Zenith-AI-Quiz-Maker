import { useMemo } from 'react';

import {
	canUseSectionQuestionLayout,
	groupQuestionsByApiSection,
	questionsGroupedBySection
} from './quizHelpers';
import QuestionDisplayLayoutToggle from './QuestionDisplayLayoutToggle';
import SectionQuestionNavigator from './SectionQuestionNavigator';
import { QUESTION_LAYOUT_SECTION, useSectionPageIndex } from './useQuestionDisplayLayout';

/**
 * Renders questions in a scrollable list or one section at a time.
 * Supports API sections ({ id, title }) or authoring sections ({ clientKey, title }).
 */
export default function QuizQuestionListLayout({
	questions = [],
	sections = [],
	layout,
	onLayoutChange,
	sectionPage: controlledSectionPage,
	onSectionPageChange,
	showLayoutToggle = true,
	className = '',
	listClassName = 'space-y-4',
	renderQuestion,
	footer = null,
	headerExtra = null,
	renderSectionHeader = null,
	sectionNavigatorExtra = null
}) {
	const useAuthoringKeys = sections.some((s) => s?.clientKey);
	const groups = useMemo(() => {
		if (useAuthoringKeys) {
			return questionsGroupedBySection(questions, sections).filter((g) => g.questions.length > 0);
		}
		return groupQuestionsByApiSection(questions, sections);
	}, [questions, sections, useAuthoringKeys]);

	const sectionLayoutAvailable = canUseSectionQuestionLayout(sections) && groups.length >= 2;
	const effectiveLayout =
		layout === QUESTION_LAYOUT_SECTION && sectionLayoutAvailable
			? QUESTION_LAYOUT_SECTION
			: 'scroll';

	const [internalSectionPage, setInternalSectionPage] = useSectionPageIndex(groups);
	const sectionPage = controlledSectionPage ?? internalSectionPage;
	const setSectionPage = onSectionPageChange ?? setInternalSectionPage;

	const visibleQuestions =
		effectiveLayout === QUESTION_LAYOUT_SECTION
			? (groups[sectionPage]?.questions ?? [])
			: questions;

	return (
		<div className={className}>
			{(showLayoutToggle && sectionLayoutAvailable) || headerExtra ? (
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					{headerExtra}
					{showLayoutToggle && sectionLayoutAvailable && (
						<QuestionDisplayLayoutToggle layout={layout} onLayoutChange={onLayoutChange} />
					)}
				</div>
			) : null}

			{effectiveLayout === QUESTION_LAYOUT_SECTION && (
				<SectionQuestionNavigator
					groups={groups}
					sectionPage={sectionPage}
					onSectionPageChange={setSectionPage}
					className="mb-4"
					headerExtra={
						typeof sectionNavigatorExtra === 'function'
							? sectionNavigatorExtra(groups[sectionPage], sectionPage)
							: sectionNavigatorExtra
					}
				/>
			)}

			{effectiveLayout !== QUESTION_LAYOUT_SECTION &&
			typeof renderSectionHeader === 'function' &&
			groups.some((g) => g.section) ? (
				<div className="space-y-8">
					{groups.map((group, gi) => (
						<div key={group.section?.id ?? group.section?.clientKey ?? `group-${gi}`}>
							{group.section ? <div className="mb-4">{renderSectionHeader(group, gi)}</div> : null}
							<div className={listClassName}>
								{group.questions.map((question, index) => renderQuestion(question, index))}
							</div>
						</div>
					))}
				</div>
			) : (
				<div className={listClassName}>
					{visibleQuestions.map((question, index) => renderQuestion(question, index))}
				</div>
			)}

			{footer}
		</div>
	);
}
