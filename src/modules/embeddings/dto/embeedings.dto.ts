import { ArrayMinSize, IsArray, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SaveEmbeddingDto {
  @IsArray()
  @ArrayMinSize(1536)
  @IsNumber({}, { each: true })
  vector: number[];
}

export class SearchSimilarDto {
  @IsArray()
  @ArrayMinSize(768)
  @IsNumber({}, { each: true })
  vector: number[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;
}
