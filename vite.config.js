// vite.config.js
import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
    // 환경변수 로드
    const env = loadEnv(mode, process.cwd(), '');
    const apiKey = (env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '').trim();
    
    return {
        build: {
            rollupOptions: {
                input: {
                    main: resolve(__dirname, 'index.html'),
                },
            },
        },
        server: {
            proxy: {
                '/api/chat': {
                    target: 'https://api.openai.com',
                    changeOrigin: true,
                    rewrite: (path) => '/v1/chat/completions',
                    configure: (proxy, _options) => {
                        proxy.on('proxyReq', (proxyReq, req, _res) => {
                            // API Key를 Authorization 헤더에 추가
                            if (apiKey) {
                                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
                            }
                        });
                    },
                },
            },
        },
    };
});