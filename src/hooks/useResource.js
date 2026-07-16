import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { del, get, patch, post } from '../lib/api'
import { toast } from '../stores/toastStore'

export function createResourceHooks(key, basePath) {
  const listKey = (params) => [key, 'list', params || {}]
  const detailKey = (id) => [key, 'detail', id]

  function useList(params, options = {}) {
    return useQuery({
      queryKey: listKey(params),
      queryFn: () => get(basePath, { params }),
      ...options,
    })
  }

  function useDetail(id, options = {}) {
    return useQuery({
      queryKey: detailKey(id),
      queryFn: () => get(`${basePath}${id}/`),
      enabled: id != null,
      ...options,
    })
  }

  function useCreate(options = {}) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (body) => post(basePath, body),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: [key] })
      },
      onError: () => toast.error('Could not save changes.'),
      ...options,
    })
  }

  function useUpdate(options = {}) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, ...body }) => patch(`${basePath}${id}/`, body),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
      onError: () => toast.error('Could not save changes.'),
      ...options,
    })
  }

  function useRemove(options = {}) {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id) => del(`${basePath}${id}/`),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
      onError: () => toast.error('Could not delete.'),
      ...options,
    })
  }

  return { key, basePath, listKey, detailKey, useList, useDetail, useCreate, useUpdate, useRemove }
}
