import { NextApiRequest, NextApiResponse } from 'next';
import { fileStorage } from '@/lib/files/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path } = req.query;
    
    if (!path || !Array.isArray(path) || path.length === 0) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const filePath = path.join('/');
    
    // Get file stream
    const fileStream = await fileStorage.getFileStream(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${path[path.length - 1]}"`);
    
    // Pipe file to response
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.status(404).json({ error: 'File not found' });
      }
    });
    
    fileStream.on('end', () => {
      res.end();
    });
  } catch (error: any) {
    console.error('Serve file error:', error);
    res.status(500).json({ error: error.message || 'Failed to serve file' });
  }
}
