import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	// Only expose variables prefixed with VITE_ to the client
	const envWithVitePrefix = Object.keys(env)
		.filter((key) => key.startsWith('VITE_'))
		.reduce((acc, key) => {
			acc[`process.env.${key}`] = JSON.stringify(env[key]);
			return acc;
		}, {});

	return {
		define: envWithVitePrefix,
		plugins: [react(), tailwindcss()],
		build: {
			rollupOptions: {
				output: {
					manualChunks: {
						// Split vendor chunks for better caching and parallel loading
						'react-vendor': ['react', 'react-dom', 'react-router-dom'],
						'chart-vendor': ['chart.js', 'react-chartjs-2'],
						'math-vendor': ['react-latex-next'],
						'icons-vendor': ['lucide-react']
					},
					// Optimize asset file names for better caching
					assetFileNames: (assetInfo) => {
						// Group font files together
						if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
							return 'assets/fonts/[name]-[hash][extname]';
						}
						return 'assets/[name]-[hash][extname]';
					}
				}
			},
			chunkSizeWarningLimit: 1000,
			// Improve CSS code splitting
			cssCodeSplit: true
		}
	};
});
