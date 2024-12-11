import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Logger,
  Req,
} from '@nestjs/common';
import { getMulterUploader } from './uploader';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

@Controller('upload')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Post('file')
  @UseInterceptors(FilesInterceptor('files', 10, getMulterUploader('files')))
  uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    // Log kiruvchi so'rov ma'lumotlari
    this.logger.log(`Request Headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`Request Body: ${JSON.stringify(req.body)}`);

    if (!files || files.length === 0) {
      throw new Error('No files uploaded');
    }

    // Yuklangan fayllar haqida ma'lumotlarni qaytarish
    const uploadedFiles = files.map((file) => {
      const fileInfo = {
        fileName: file.filename,
        fileUrl: `/uploads/files/${file.filename}`,
      };

      // Fayl logini chiqarish
      this.logger.log(`File uploaded: ${JSON.stringify(fileInfo)}`);
      return fileInfo;
    });

    return {
      message: 'Files uploaded successfully',
      files: uploadedFiles,
    };
  }
}
