import { diskStorage, Options } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

// Multer konfiguratsiyasi uchun funksiyani yangilang
export function getMulterUploader(address: string): Options {
    return {
      storage: diskStorage({
        destination: function (req, file, cb) {
          const uploadPath = `./uploads/${address}`;
          cb(null, uploadPath); // Fayllarni saqlash manzili
        },
        filename: function (req, file, cb) {
          const extension = path.extname(file.originalname);
          const uniqueName = `${uuidv4()}${extension}`;
          cb(null, uniqueName); // Fayl nomi uchun noyob nom
        },
      }),
      limits: { fileSize: 500 * 1024 * 1024 }, // Maksimal fayl hajmi: 5MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|pdf|txt)$/)) {
          cb(null, false); // Fayl ruxsat etilmagan
          return cb(new Error('Only image or PDF files are allowed!'));
        }
        cb(null, true); // Fayl qabul qilindi
      },
    };
  }