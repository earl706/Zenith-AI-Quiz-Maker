import { motion } from 'framer-motion';

export function PageHeader({ title, description, actions, icon: Icon }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: -6 }}
			animate={{ opacity: 1, y: 0 }}
			className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
		>
			<div className="flex items-center gap-3">
				{Icon && (
					<div className="bg-primary/12 text-primary flex h-10 w-10 items-center justify-center rounded-sm">
						<Icon size={20} />
					</div>
				)}
				<div>
					<h1 className="text-fg text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
					{description && <p className="text-muted text-sm">{description}</p>}
				</div>
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</motion.div>
	);
}
