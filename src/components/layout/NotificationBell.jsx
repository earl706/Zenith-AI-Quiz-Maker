import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { get, post } from '../../lib/api';
import { Button } from '../ui';

export function NotificationBell() {
	const navigate = useNavigate();
	const qc = useQueryClient();

	const { data } = useQuery({
		queryKey: ['notifications', 'unread-count'],
		queryFn: () => get('/notifications/unread-count/'),
		refetchInterval: 30000
	});

	const markAll = useMutation({
		mutationFn: () => post('/notifications/mark-all-read/'),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['notifications'] });
		}
	});

	const count = data?.count || 0;

	return (
		<div className="relative">
			<details className="group">
				<summary className="hover:bg-surface-2 relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md [&::-webkit-details-marker]:hidden">
					<Bell size={18} className="text-muted" />
					{count > 0 && (
						<span className="bg-danger absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white">
							{count > 9 ? '9+' : count}
						</span>
					)}
					<span className="sr-only">Notifications</span>
				</summary>
				<div className="border-line bg-surface absolute right-0 z-40 mt-2 w-80 rounded-md border shadow-lg">
					<div className="border-line flex items-center justify-between border-b px-3 py-2">
						<p className="text-fg text-sm font-medium">Notifications</p>
						{count > 0 && (
							<Button size="sm" variant="ghost" onClick={() => markAll.mutate()}>
								Mark all read
							</Button>
						)}
					</div>
					<NotificationList navigate={navigate} />
				</div>
			</details>
		</div>
	);
}

function NotificationList({ navigate }) {
	const { data, isLoading } = useQuery({
		queryKey: ['notifications', 'recent'],
		queryFn: () => get('/notifications/'),
		refetchInterval: 30000
	});
	const qc = useQueryClient();
	const items = Array.isArray(data) ? data : data?.results || [];

	const markRead = useMutation({
		mutationFn: (id) => post(`/notifications/${id}/read/`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] })
	});

	if (isLoading) {
		return <p className="text-muted p-3 text-xs">Loading…</p>;
	}
	if (!items.length) {
		return <p className="text-muted p-3 text-xs">No notifications yet.</p>;
	}

	return (
		<ul className="max-h-72 overflow-y-auto">
			{items.slice(0, 10).map((n) => (
				<li key={n.id}>
					<button
						type="button"
						className={`hover:bg-surface-2 w-full cursor-pointer px-3 py-2 text-left ${
							n.is_read ? 'opacity-70' : ''
						}`}
						onClick={() => {
							if (!n.is_read) markRead.mutate(n.id);
							if (n.link) navigate(n.link);
						}}
					>
						<p className="text-fg text-sm font-medium">{n.title}</p>
						{n.body && <p className="text-muted line-clamp-2 text-xs">{n.body}</p>}
					</button>
				</li>
			))}
		</ul>
	);
}
