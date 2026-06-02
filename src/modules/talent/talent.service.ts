import { Injectable } from '@nestjs/common';

@Injectable()
export class TalentService {
    getHello(): string {
        return 'Hello Talent';
    }
}