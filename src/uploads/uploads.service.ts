import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  deleteFile(filePath: string): void {
    const absPath = path.resolve(filePath);
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  }
}
