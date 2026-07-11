import { Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('avatar/:talentid')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('talentid') talentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.filesService.uploadAvatar(file, talentId);
    return { url };
  }
}
