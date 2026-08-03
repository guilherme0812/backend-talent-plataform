import {
  Injectable,
  Inject,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MINIO_CLIENT } from 'src/config/minio.config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import { TalentService } from '../talent/talent.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { Ollama } from 'ollama';
import { PDFParse } from 'pdf-parse';
import { z } from 'zod';

export const ExtractedTalentSchema = z.object({
  name: z.string().min(1).nullable(),
  email: z.string().email().nullable(),
  bio: z.string().nullable(),
  skills: z.array(z.string()).default([]),
  location: z.string().nullable(),
  yearsOfExperience: z.number().int().min(0).max(60).nullable(),
});
export type ExtractedTalent = z.infer<typeof ExtractedTalentSchema>;

export type BucketName = 'avatars' | 'resumes';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  private readonly allowedDocTypes = ['application/pdf'];
  private readonly maxImageSize = 5 * 1024 * 1024; // 5 MB
  private readonly maxDocSize = 10 * 1024 * 1024; // 10 MB

  private readonly ollama: Ollama;
  private readonly ollamaModel: string;

  constructor(
    @Inject(MINIO_CLIENT) private readonly minio: Minio.Client,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => TalentService))
    private readonly talentService: TalentService,
    private readonly embeddingsService: EmbeddingsService,
  ) {
    this.ollama = new Ollama({
      host: this.config.get('OLLAMA_URL', 'http://localhost:11434'),
    });
    this.ollamaModel = this.config.get('OLLAMA_CHAT_MODEL', 'llama3.1');
  }

  async uploadAvatar(file: Express.Multer.File, talentId: string): Promise<string> {
    const talent = await this.talentService.findOne(talentId);

    this.validateImage(file);
    const ext = file.originalname.split('.').pop();
    const objectName = `${talentId}/${uuidv4()}.${ext}`;

    const url = await this.upload('avatars', objectName, file);

    talent.avatarUrl = url;
    await this.talentService.update(talentId, talent);

    return url;
  }

  async uploadResume(file: Express.Multer.File, talentId: string): Promise<void> {
    const talent = await this.talentService.findOne(talentId);

    this.validateDocument(file);

    const uuid = uuidv4();
    const objectName = `${talentId}/${uuid}.pdf`;

    talent.resumeObjectName = objectName;

    const fileText = await this.extractTextFromFile(file);

    await this.embeddingsService.generateEmbeddingfromFile(fileText, talentId);

    await this.upload('resumes', objectName, file);

    await this.talentService.update(talentId, talent);
  }

  private async upload(
    bucket: BucketName,
    objectName: string,
    file: Express.Multer.File,
  ): Promise<string> {
    try {
      await this.minio.putObject(bucket, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
      this.logger.log(`Upload with success: ${bucket}/${objectName}`);
      return this.getPresignedUrl(bucket, objectName);
    } catch (error: any) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw new InternalServerErrorException('Error uploading file');
    }
  }

  private buildPublicUrl(bucket: string, objectName: string): string {
    const endpoint: string = this.config.get('MINIO_ENDPOINT', 'localhost');
    const port: string = this.config.get('MINIO_PORT', '9000');
    const ssl = this.config.get('MINIO_USE_SSL', 'false') === 'true';
    const protocol = ssl ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${bucket}/${objectName}`;
  }

  async getPresignedUrl(bucket: BucketName, objectName: string): Promise<string> {
    try {
      return await this.minio.presignedGetObject(bucket, objectName, 3600);
    } catch (err) {
      this.logger.error(`Error on generating presigned URL: ${err.message}`);
      throw new InternalServerErrorException('Error on generating presigned URL');
    }
  }

  async deleteObject(bucket: BucketName, objectName: string): Promise<void> {
    try {
      await this.minio.removeObject(bucket, objectName);
    } catch (error: any) {
      this.logger.error(`Error deleting object: ${error.message}`);
      throw new InternalServerErrorException('Error deleting object');
    }
  }

  async extractTextFromFile(file: Express.Multer.File): Promise<string> {
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();

    return result.text;
  }

  async extractTalentFromFile(file: Express.Multer.File): Promise<ExtractedTalent> {
    const text = await this.extractTextFromFile(file);

    if (!text || text.trim().length === 0) {
      throw new BadRequestException('It is not possible extract the text from file.');
    }

    return this.extractTalentDataFromText(text);
  }

  async extractTalentDataFromText(text: string): Promise<ExtractedTalent> {
    const prompt = `
        Você é um extrator de dados de currículos. Extraia as informações abaixo do texto
        do currículo fornecido e responda APENAS com um JSON válido, sem nenhum texto
        adicional, sem markdown, sem explicações.

        Formato esperado (use null quando a informação não estiver presente):
        {
          "name": string | null,
          "email": string | null,
          "bio": string | null,          // resumo profissional em 1-2 frases
          "skills": string[],            // lista de tecnologias/competências técnicas
          "location": string | null,     // cidade, país
          "yearsOfExperience": number | null
        }

        Currículo:
        """
        ${text}
        """
  `.trim();

    let raw: string;

    try {
      const response = await this.ollama.chat({
        model: this.ollamaModel,
        messages: [{ role: 'user', content: prompt }],
        format: 'json',
        options: { temperature: 0 },
      });

      raw = response.message.content;
    } catch (error: any) {
      this.logger.error(`Erro ao chamar modelo de extração: ${error.message}`);
      throw new InternalServerErrorException('Erro ao processar currículo com o modelo de IA');
    }

    return this.parseAndValidate(raw);
  }

  private parseAndValidate(raw: string): ExtractedTalent {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger.error(`Modelo retornou JSON inválido: ${raw}`);
      throw new InternalServerErrorException('O modelo não retornou um JSON válido');
    }

    const result = ExtractedTalentSchema.safeParse(parsed);

    if (!result.success) {
      this.logger.warn(
        `JSON extraído não bateu com o schema: ${JSON.stringify(result.error.issues)}`,
      );
      // fallback: em vez de falhar, você pode optar por sanitizar e devolver o
      // que der para aproveitar, deixando o recrutador corrigir o resto.
      throw new BadRequestException('Não foi possível validar os dados extraídos do currículo');
    }

    return result.data;
  }

  private validateImage(file: Express.Multer.File): void {
    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image type');
    }
    if (file.size > this.maxImageSize) {
      throw new BadRequestException('Image size exceeds limit');
    }
  }

  private validateDocument(file: Express.Multer.File): void {
    if (!this.allowedDocTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid document type');
    }
    if (file.size > this.maxDocSize) {
      throw new BadRequestException('Document size exceeds limit');
    }
  }
}
