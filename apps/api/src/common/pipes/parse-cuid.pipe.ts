import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const CUID_PATTERN = /^c[a-z0-9]{20,}$/i;

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!CUID_PATTERN.test(value)) {
      throw new BadRequestException('Malformed identifier');
    }
    return value;
  }
}
