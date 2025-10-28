import { adminStorage } from '@/lib/firebaseAdmin';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const FILES_DIR = path.join(process.cwd(), '.data', 'files');

function ensureFilesDir() {
  if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
  }
}

function getHashedFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = uuidv4();
  return `${hash}${ext}`;
}

export interface FileUpload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StoredFile {
  url: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export class FileStorage {
  async uploadFile(file: FileUpload, folder: string = 'uploads'): Promise<StoredFile> {
    const hasFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY;
    
    if (hasFirebase) {
      return this.uploadToFirebase(file, folder);
    }
    
    return this.uploadToLocal(file, folder);
  }

  private async uploadToFirebase(file: FileUpload, folder: string): Promise<StoredFile> {
    const fileName = getHashedFileName(file.originalName);
    const filePath = `${folder}/${fileName}`;
    
    const bucket = adminStorage;
    const fileUpload = bucket.file(filePath);
    
    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimeType,
        metadata: {
          originalName: file.originalName,
          uploadedAt: Date.now().toString(),
        },
      },
    });

    await fileUpload.makePublic();
    const publicUrl = fileUpload.publicUrl();

    return {
      url: publicUrl,
      path: filePath,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
    };
  }

  private async uploadToLocal(file: FileUpload, folder: string): Promise<StoredFile> {
    ensureFilesDir();
    
    const folderPath = path.join(FILES_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    const fileName = getHashedFileName(file.originalName);
    const filePath = path.join(folderPath, fileName);
    
    fs.writeFileSync(filePath, file.buffer);
    
    const relativePath = path.relative(process.cwd(), filePath);
    const url = `/api/files/${folder}/${fileName}`;

    return {
      url,
      path: relativePath,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    const hasFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY;
    
    if (hasFirebase) {
      const bucket = adminStorage;
      const file = bucket.file(filePath);
      await file.delete();
    } else {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  }

  async getFileStream(filePath: string): Promise<NodeJS.ReadableStream> {
    const hasFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY;
    
    if (hasFirebase) {
      const bucket = adminStorage;
      const file = bucket.file(filePath);
      return file.createReadStream();
    } else {
      const fullPath = path.join(process.cwd(), filePath);
      return fs.createReadStream(fullPath);
    }
  }
}

export const fileStorage = new FileStorage();

