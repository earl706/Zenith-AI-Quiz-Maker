import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { del, get, patch, post } from '../lib/api';
import { toast } from '../stores/toastStore';

function omitFromListData(old, id) {
	if (old == null) return old;
	const keep = (item) => item?.id == null || String(item.id) !== String(id);
	if (Array.isArray(old)) return old.filter(keep);
	if (Array.isArray(old.results)) {
		const results = old.results.filter(keep);
		return {
			...old,
			results,
			...(typeof old.count === 'number'
				? { count: Math.max(0, old.count - (old.results.length - results.length)) }
				: {})
		};
	}
	return old;
}

export function createResourceHooks(key, basePath) {
	const listKey = (params) => [key, 'list', params || {}];
	const detailKey = (id) => [key, 'detail', id];

	function useList(params, options = {}) {
		return useQuery({
			queryKey: listKey(params),
			queryFn: () => get(basePath, { params }),
			...options
		});
	}

	function useDetail(id, options = {}) {
		return useQuery({
			queryKey: detailKey(id),
			queryFn: () => get(`${basePath}${id}/`),
			enabled: id != null,
			...options
		});
	}

	function useCreate(options = {}) {
		const qc = useQueryClient();
		const { onSuccess, onError, ...rest } = options;
		return useMutation({
			mutationFn: (body) => post(basePath, body),
			onSuccess: (...args) => {
				qc.invalidateQueries({ queryKey: [key] });
				onSuccess?.(...args);
			},
			onError: (...args) => {
				if (onError) onError(...args);
				else toast.error('Could not save changes.');
			},
			...rest
		});
	}

	function useUpdate(options = {}) {
		const qc = useQueryClient();
		const { onSuccess, onError, ...rest } = options;
		return useMutation({
			mutationFn: ({ id, ...body }) => patch(`${basePath}${id}/`, body),
			onSuccess: (...args) => {
				qc.invalidateQueries({ queryKey: [key] });
				onSuccess?.(...args);
			},
			onError: (...args) => {
				if (onError) onError(...args);
				else toast.error('Could not save changes.');
			},
			...rest
		});
	}

	function useRemove(options = {}) {
		const qc = useQueryClient();
		const { onSuccess, onError, onMutate, onSettled, ...rest } = options;
		return useMutation({
			mutationFn: (id) => del(`${basePath}${id}/`),
			onMutate: async (id) => {
				await qc.cancelQueries({ queryKey: [key] });
				const previousLists = qc.getQueriesData({ queryKey: [key, 'list'] });
				qc.setQueriesData({ queryKey: [key, 'list'] }, (old) => omitFromListData(old, id));
				qc.removeQueries({ queryKey: detailKey(id) });
				const userContext = await onMutate?.(id);
				return { previousLists, userContext };
			},
			onError: (err, id, context) => {
				context?.previousLists?.forEach(([queryKey, data]) => {
					qc.setQueryData(queryKey, data);
				});
				if (onError) onError(err, id, context?.userContext);
				else toast.error('Could not delete.');
			},
			onSuccess: (data, id, context) => {
				onSuccess?.(data, id, context?.userContext);
			},
			onSettled: (data, error, id, context) => {
				qc.invalidateQueries({ queryKey: [key] });
				onSettled?.(data, error, id, context?.userContext);
			},
			...rest
		});
	}

	return { key, basePath, listKey, detailKey, useList, useDetail, useCreate, useUpdate, useRemove };
}
