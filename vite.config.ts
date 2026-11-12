import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function laravelApiPlugin() {
  return {
    name: 'laravel-api-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/v1')) {
          return next();
        }

        try {
          const { handleApiRequest } = await server.ssrLoadModule('/src/server/laravelApiHandler.js');

          let body = null;
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            const raw = Buffer.concat(buffers).toString('utf-8');
            try {
              body = JSON.parse(raw);
            } catch {
              body = raw;
            }
          }

          const result = handleApiRequest(req.url, req.method, body, req.headers);
          res.statusCode = result.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result.body));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err?.message || 'Internal Server Error' }));
        }
      });
    }
  };
}

export default defineConfig(() => {
  const useMockApi = process.env.USE_MOCK_API === 'true';
  const backendTarget = process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

  return {
    plugins: [
      ...(useMockApi ? [laravelApiPlugin()] : []),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@tiptap')) {
                return 'vendor-editor';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@reduxjs') || id.includes('react-redux')) {
                return 'vendor-redux';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              return 'vendor-other';
            }
          }
        }
      }
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: useMockApi
        ? undefined
        : {
            '/api': {
              target: backendTarget,
              changeOrigin: true,
            },
            '/storage': {
              target: backendTarget,
              changeOrigin: true,
            },
          },
    },
  };
});
