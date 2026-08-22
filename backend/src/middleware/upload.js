import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

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

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function imageOnlyFilter(req, file, cb) {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest('Only JPEG, PNG, or WebP images are allowed'));
    return;
  }
  cb(null, true);
}

export const uploadAvatar = multer({
  storage: makeStorage('avatars'),
  limits,
  fileFilter: imageOnlyFilter,
});

export const uploadLogo = multer({
  storage: makeStorage('logos'),
  limits,
  fileFilter: imageOnlyFilter,
});

const ALLOWED_ATTACHMENT_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

function attachmentFilter(req, file, cb) {
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest('Only JPEG, PNG, or PDF files are allowed'));
    return;
  }
  cb(null, true);
}

export const uploadAttachment = multer({
  storage: makeStorage('attachments'),
  limits,
  fileFilter: attachmentFilter,
});
