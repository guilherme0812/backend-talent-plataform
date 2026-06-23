import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  async getPresignedUrl() {}

  async deleteObject() {}

  private async upload() {}

  private buildPublicUrl() {}

  private validateImage() {}

  private validateDocument() {}
}
