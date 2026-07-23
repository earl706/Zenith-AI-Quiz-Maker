import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	const envWithVitePrefix = Object.keys(env)
		.filter((key) => key.startsWith('VITE_'))
		.reduce((acc, key) => {
			acc[`process.env.${key}`] = JSON.stringify(env[key]);
			return acc;
		}, {});

	return {
		define: envWithVitePrefix,
		plugins: [react(), tailwindcss()],
		server: {
			port: 5173,
			proxy: {
				'/api': {
					target: 'http://127.0.0.1:8001',
					changeOrigin: true
				}
			}
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						'react-vendor': ['react', 'react-dom', 'react-router-dom'],
						'chart-vendor': ['chart.js', 'react-chartjs-2'],
						'math-vendor': ['react-latex-next', 'mathlive']
					}
				}
			},
			chunkSizeWarningLimit: 1000,
			cssCodeSplit: true
		}
	};
});
