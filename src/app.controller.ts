import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Logger,
} from '@nestjs/common';
import { getMulterUploader } from './uploader';
import {  FilesInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Post('file')
  @UseInterceptors(FilesInterceptor('files',10, getMulterUploader('files')))
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
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

