import { createResourceHooks } from '../hooks/useResource';
import { patch, post } from './api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const habitsApi = createResourceHooks('habits', '/habits/');
export const roadmapsApi = createResourceHooks('roadmaps', '/roadmaps/');
export const notificationsApi = createResourceHooks('notifications', '/notifications/');

export function useHabitCheckIn() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, undo, ...body }) =>
			post(`/habits/${id}/${undo ? 'undo' : 'check-in'}/`, body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] })
	});
}

/** POST /habits/ensure-defaults/ is a no-op; kept for older clients. */
export function useEnsureDefaultHabits() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: () => post('/habits/ensure-defaults/'),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] })
	});
}

export function useForkRoadmap() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body) => post('/roadmaps/fork/', body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmaps'] })
	});
}

export function useForkRoadmapFromQuiz() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (body) => post('/roadmaps/fork-quiz/', body),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['roadmaps'] })
	});
}

export function useResyncRoadmap() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (roadmapId) => post(`/roadmaps/${roadmapId}/resync/`),
		onSuccess: (data, roadmapId) => {
			qc.invalidateQueries({ queryKey: ['roadmaps'] });
			if (roadmapId != null) {
				qc.setQueryData(['roadmaps', 'detail', roadmapId], data);
			}
		}
	});
}

export function useResetRoadmapSchedule() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (roadmapId) => post(`/roadmaps/${roadmapId}/reset-schedule/`),
		onSuccess: (data, roadmapId) => {
			qc.invalidateQueries({ queryKey: ['roadmaps'] });
			if (roadmapId != null) {
				qc.setQueryData(['roadmaps', 'detail', roadmapId], data);
			}
		}
	});
}

export function usePatchRoadmapNode() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ roadmapId, nodeId, ...body }) =>
			patch(`/roadmaps/${roadmapId}/nodes/${nodeId}/`, body),
		onSuccess: (data, vars) => {
			qc.invalidateQueries({ queryKey: ['roadmaps'] });
			if (vars?.roadmapId != null) {
				qc.setQueryData(['roadmaps', 'detail', vars.roadmapId], data);
			}
		}
	});
}

export function useBulkRoadmapMastery() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ roadmapId, ...body }) => patch(`/roadmaps/${roadmapId}/bulk-mastery/`, body),
		onSuccess: (data, vars) => {
			qc.invalidateQueries({ queryKey: ['roadmaps'] });
			if (vars?.roadmapId != null) {
				qc.setQueryData(['roadmaps', 'detail', vars.roadmapId], data);
			}
		}
	});
}
