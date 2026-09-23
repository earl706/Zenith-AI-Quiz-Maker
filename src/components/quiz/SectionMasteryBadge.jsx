import { GitBranch, Lock, Sparkles } from 'lucide-react';

import { Badge } from '../ui';

export function listRoadmaps(payload) {
	if (!payload) return [];
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload.results)) return payload.results;
	return [];
}

/** Prefer source_quiz match, then linked quiz, then lowest id (oldest). */
export function pickRoadmapForQuiz(payload, quizUuid) {
	if (quizUuid == null || quizUuid === '') return null;
	const uid = String(quizUuid);
	const items = listRoadmaps(payload);
	const source = items.filter((r) => r?.source_quiz_uuid && String(r.source_quiz_uuid) === uid);
	const linked = items.filter((r) => r?.linked_quiz_uuid && String(r.linked_quiz_uuid) === uid);
	const pool = source.length ? source : linked;
	if (!pool.length) return null;
	return [...pool].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))[0];
}

export function nodeForSection(nodes, section) {
	if (!section || !Array.isArray(nodes) || !nodes.length) return null;
	const sid = section.id;
	if (sid != null && sid !== '') {
		const byId = nodes.find((n) => n?.section_id != null && String(n.section_id) === String(sid));
		if (byId) return byId;
	}
	const title = String(section.title || '')
		.trim()
		.toLowerCase();
	if (!title) return null;
	return (
		nodes.find(
			(n) =>
				String(n?.title || '')
					.trim()
					.toLowerCase() === title
		) || null
	);
}

const STATUS = {
	mastered: {
		tone: 'success',
		label: 'Mastered',
		Icon: Sparkles
	},
	available: {
		tone: 'primary',
		label: 'Available',
		Icon: GitBranch
	},
	locked: {
		tone: 'neutral',
		label: 'Locked',
		Icon: Lock
	}
};

export default function SectionMasteryBadge({ node, className }) {
	if (!node?.status) return null;
	const spec = STATUS[node.status];
	if (!spec) return null;
	const { tone, label, Icon } = spec;
	const title =
		node.status === 'mastered'
			? 'Section mastered on a linked roadmap'
			: node.status === 'locked'
				? 'Locked on the linked roadmap until prerequisites are mastered'
				: 'Available on the linked roadmap';

	return (
		<Badge tone={tone} className={className} title={title} aria-label={title}>
			<Icon size={11} aria-hidden />
			{label}
		</Badge>
	);
}
