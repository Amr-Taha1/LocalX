import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initFileSystem } from './server/db';
import { getLocalIpAddresses } from './server/network';
import { setupSocketIO } from './server/socket';
import { createApiRouter } from './server/routes/api';

async function startServer() {
  // Initialize local JSON storage and uploads directory
  initFileSystem();

  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Static uploads directory for media (images, videos, files)
  const uploadsPath = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Initialize Socket.IO
  const io = setupSocketIO(server);

  // Mount API router
  app.use('/api', createApiRouter(io));

  // Vite middleware for development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    const { primaryIp, allIps } = getLocalIpAddresses();
    console.log('====================================================');
    console.log('  🏠 FAMILY NETWORK — PRIVATE LAN SOCIAL APP');
    console.log('====================================================');
    console.log(`  Local: http://localhost:${PORT}`);
    console.log(`  LAN:   http://${primaryIp}:${PORT}`);
    if (allIps.length > 1) {
      console.log(`  All Detected IPs: ${allIps.map(ip => `http://${ip}:${PORT}`).join(', ')}`);
    }
    console.log('====================================================');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
