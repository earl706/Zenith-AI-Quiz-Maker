import { Clock } from 'lucide-react';

import { formatDurationSeconds } from '../../lib/format';
import { Badge, Card, ProgressRing } from '../ui';
import { accuracyTone } from './quizHelpers';

export default function AttemptStatusPanel({
	time,
	answeredCount,
	totalQuestions,
	showResults,
	score,
	accuracy,
	sectionScores = []
}) {
	const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
	const tone = accuracyTone(accuracy);

	return (
		<aside className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-6 lg:w-64 lg:self-start">
			<Card className="p-5 text-center">
				<p className="text-muted mb-3 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
					<Clock size={13} />
					Time
				</p>
				<p className="text-fg font-mono text-3xl font-bold tracking-tight">
					{formatDurationSeconds(time)}
				</p>
			</Card>

			{!showResults && (
				<Card className="flex flex-col items-center gap-3 p-5">
					<p className="text-muted text-xs font-medium tracking-wide uppercase">Progress</p>
					<ProgressRing value={progressPct} size={72} stroke={6} tone="primary" />
					<p className="text-fg text-sm font-medium">
						{answeredCount} of {totalQuestions} answered
					</p>
				</Card>
			)}

			{showResults && (
				<Card className="space-y-4 p-5 text-center">
					<div>
						<p className="text-muted mb-1 text-xs font-medium tracking-wide uppercase">Score</p>
						<p className="text-fg text-2xl font-bold">{score}</p>
					</div>
					<div className="border-line border-t pt-4">
						<p className="text-muted mb-2 text-xs font-medium tracking-wide uppercase">Accuracy</p>
						<div className="flex flex-col items-center gap-2">
							<ProgressRing
								value={Number.parseFloat(accuracy) || 0}
								size={72}
								stroke={6}
								tone={tone}
								label={`${Math.round(Number.parseFloat(accuracy) || 0)}`}
							/>
							<Badge tone={tone}>{accuracy}%</Badge>
						</div>
					</div>
					{sectionScores.length > 0 && (
						<div className="border-line space-y-2 border-t pt-4 text-left">
							<p className="text-muted text-xs font-medium tracking-wide uppercase">By section</p>
							<ul className="space-y-1.5">
								{sectionScores.map((ss) => (
									<li
										key={`${ss.section ?? 'x'}-${ss.section_title}`}
										className="flex items-center justify-between gap-2 text-xs"
									>
										<span className="text-fg truncate">{ss.section_title}</span>
										<span className="text-muted shrink-0">
											{ss.score}/{ss.total_score} · {Math.round(ss.accuracy)}%
										</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</Card>
			)}
		</aside>
	);
}
