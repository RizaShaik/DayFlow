import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, '../../uploads');

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination: path.join(uploadsRoot, subfolder),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${ext}`);
    },
  });
}

const limits = { fileSize: env.uploads.maxUploadMb * 1024 * 1024 };

export const uploadAvatar = multer({ storage: makeStorage('avatars'), limits });
export const uploadAttachment = multer({ storage: makeStorage('attachments'), limits });
