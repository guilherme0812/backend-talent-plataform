import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class FilesService implements OnModuleInit {
  onModuleInit() {
    console.log('FilesService initialized');
  }
}
