import serverless from 'serverless-http';
import app from '../../server-app';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  if (context && typeof context === 'object') {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // Ensure Netlify redirect /api/* -> /.netlify/functions/api/:splat always routes to /api/*
  if (event && typeof event.path === 'string') {
    let normalizedPath = event.path;
    if (normalizedPath.startsWith('/.netlify/functions/api')) {
      normalizedPath = normalizedPath.replace('/.netlify/functions/api', '') || '/';
    }
    if (!normalizedPath.startsWith('/api')) {
      normalizedPath = '/api' + (normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath);
    }
    event.path = normalizedPath;
  }

  return serverlessHandler(event, context);
};
