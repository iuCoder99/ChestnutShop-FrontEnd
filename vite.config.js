import {
	defineConfig
} from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './')
		}
	},
	server: {
		host: '127.0.0.1',
		port: 8081,
		strictPort: true,
		proxy: {
			// 拦截所有 /api 开头的请求
			'/api': {
				target: 'http://127.0.0.1:8080',
				changeOrigin: true,
				secure: false
			},
			// 拦截所有 /ws 开头的 WebSocket 请求
			'/ws': {
				target: 'http://127.0.0.1:8080',
				ws: true,
				changeOrigin: true,
				secure: false
			}
		}
	},
	plugins: [uni()]
});