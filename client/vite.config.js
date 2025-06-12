import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
                ws: true,
                configure: (proxy, options) => {
                    // 代理配置
                    proxy.on('error', (err, req, res) => {
                        console.log('代理错误:', err);
                    });
                    proxy.on('proxyReq', (proxyReq, req, res) => {
                        console.log('代理请求:', req.method, req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, req, res) => {
                        console.log('代理响应:', proxyRes.statusCode, req.url);
                    });
                }
            },
        },
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: ['opengms.zicp.fun', 'localhost', '48715p9d60.zicp.vip'],
    },
}) 