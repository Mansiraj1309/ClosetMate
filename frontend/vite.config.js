import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
    },
    build: {
        rollupOptions: {
            external: [
                'onnxruntime-web/webgpu',
                'onnxruntime-web',
            ],
        },
    },
    optimizeDeps: {
        exclude: ['onnxruntime-web'],
    },
})
