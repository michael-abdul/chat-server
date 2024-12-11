import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Logger,
  Req,
  Get,
  Param,
  Res,
} from '@nestjs/common';
import { getMulterUploader } from './uploader';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs'; 
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
        fileName: file.originalname,
        fileUrl: `/uploads/files/${file.originalname}`,
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

  @Get('files/:fileName')
  getFile(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads/files', fileName);
    console.log('filePath:', filePath);
    console.log('File exists:', fs.existsSync(filePath));
    if (!fs.existsSync(filePath)) {
      res.status(404).send('File not found');
      return;
    }

    res.sendFile(filePath);
  }
}
