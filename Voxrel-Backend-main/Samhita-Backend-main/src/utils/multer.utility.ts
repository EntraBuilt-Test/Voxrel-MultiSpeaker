import multer from 'multer';

// configure multer for memory storage
const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept audio files and text documents (PDF, DOC, DOCX, TXT)
  const isAudio = file.mimetype.startsWith('audio/');
  const isTextDocument =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'text/plain' ||
    file.originalname.toLowerCase().endsWith('.pdf') ||
    file.originalname.toLowerCase().endsWith('.doc') ||
    file.originalname.toLowerCase().endsWith('.docx') ||
    file.originalname.toLowerCase().endsWith('.txt');

  if (isAudio || isTextDocument) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type! Please upload audio files or text documents (PDF, DOC, DOCX, TXT).'
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 200, // 200MB limit per file
    files: parseInt(process.env.MAX_FILES_PER_REQUEST || '150'), // Support 100+ files (default 150 for headroom)
  },
});

// Single task upload - accepts multiple field names to support both audio and text files
export const uploadAudio = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'audios', maxCount: 1 },
  { name: 'files', maxCount: 1 },
  { name: 'audioFiles', maxCount: 1 },
]);
// Support bulk uploads with multiple field names (fields approach)
export const uploadAudioArray = upload.fields([
  { name: 'audio', maxCount: parseInt(process.env.MAX_FILES_PER_REQUEST || '150') },
  { name: 'audios', maxCount: parseInt(process.env.MAX_FILES_PER_REQUEST || '150') },
  { name: 'files', maxCount: parseInt(process.env.MAX_FILES_PER_REQUEST || '150') },
  { name: 'audioFiles', maxCount: parseInt(process.env.MAX_FILES_PER_REQUEST || '150') },
]);
// Support bulk uploads with array approach (simpler for clients uploading all files with same field name)
export const uploadAudioBulk = upload.array(
  'audio',
  parseInt(process.env.MAX_FILES_PER_REQUEST || '150')
);
