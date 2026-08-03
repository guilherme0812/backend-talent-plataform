import { Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('avatar/:talentId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('talentId') talentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadAvatar(file, talentId);
    return { url };
  }

  @Post('resume/:talentId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(
    @Param('talentId') talentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadResume(file, talentId);
    return { url };
  }

  @Get('presigned-url/:bucket/:talentId/:fileName')
  async getPresignedUrl(
    @Param('bucket') bucket: 'avatars' | 'resumes',
    @Param('talentId') talentId: string,
    @Param('fileName') fileName: string,
  ) {
    const objectName = `${talentId}/${fileName}`;
    const url = await this.filesService.getPresignedUrl(bucket, objectName);
    return { url };
  }

  @Post('extract-talent-from-file')
  @UseInterceptors(FileInterceptor('file'))
  async extractTalentFromFile(@UploadedFile() file: Express.Multer.File) {
    const data = await this.filesService.extractTalentFromFile(file);
    return { data };
  }
}
