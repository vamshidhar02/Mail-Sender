import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsEmail } from 'class-validator';

export class SendTestDto {
  @ApiProperty({ type: [String], maxItems: 10 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsEmail({}, { each: true })
  emails!: string[];
}
