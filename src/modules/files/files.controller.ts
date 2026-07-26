import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
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
}
