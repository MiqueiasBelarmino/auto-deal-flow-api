import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private configService: ConfigService) {}

  isR2Enabled(): boolean {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    return !!(accountId && accessKeyId && secretAccessKey && bucketName && publicUrl);
  }

  private getS3Client(): { s3: S3Client; bucketName: string; publicUrl: string } {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    const bucketName = this.configService.get<string>('R2_BUCKET_NAME');
    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      throw new Error('Cloudflare R2 configuration is incomplete');
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return { s3, bucketName, publicUrl };
  }

  async uploadFileToR2(filePath: string, key: string, mimeType: string): Promise<string> {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File does not exist: ${absPath}`);
    }

    const { s3, bucketName, publicUrl } = this.getS3Client();
    const fileBuffer = fs.readFileSync(absPath);

    try {
      this.logger.log(`Uploading file to Cloudflare R2 Bucket="${bucketName}" Key="${key}"...`);
      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        }),
      );
      this.logger.log(`File uploaded successfully to R2!`);

      // Deletar o arquivo temporário local para liberar espaço no disco
      try {
        fs.unlinkSync(absPath);
        this.logger.debug(`Deleted local temporary file: ${absPath}`);
      } catch (err) {
        this.logger.warn(`Failed to delete local temporary file: ${absPath}`, err.message);
      }

      const cleanPublicUrl = publicUrl.replace(/\/$/, '');
      return `${cleanPublicUrl}/${key}`;
    } catch (error) {
      this.logger.error(`Error uploading file to R2: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteFile(fileUrlOrPath: string): Promise<void> {
    if (!fileUrlOrPath) return;

    // Caso seja uma URL do R2 (começa com http)
    if (fileUrlOrPath.startsWith('http://') || fileUrlOrPath.startsWith('https://')) {
      if (this.isR2Enabled()) {
        try {
          const { s3, bucketName, publicUrl } = this.getS3Client();
          const cleanPublicUrl = publicUrl.replace(/\/$/, '');
          
          // Extrair a Key a partir do endereço público
          // Se URL for https://imagens.sualoja.com/vehicles/id/foto.jpg
          // a Key será: vehicles/id/foto.jpg
          let key = fileUrlOrPath.replace(cleanPublicUrl, '');
          key = key.replace(/^\//, ''); // Remove barra inicial se houver

          this.logger.log(`Deleting object from R2 Bucket="${bucketName}" Key="${key}"...`);
          await s3.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: key,
            }),
          );
          this.logger.log(`Object deleted successfully from R2!`);
        } catch (error) {
          this.logger.error(`Error deleting R2 object: ${error.message}`);
        }
      } else {
        this.logger.warn(
          `Cannot delete R2 object: R2 credentials not configured. URL: ${fileUrlOrPath}`,
        );
      }
      return;
    }

    // Fallback: deleção padrão de arquivo local
    try {
      const cleanPath = fileUrlOrPath.replace(/^\//, ''); // Remove barra inicial do path
      const absPath = path.resolve(cleanPath);
      if (fs.existsSync(absPath)) {
        fs.unlinkSync(absPath);
        this.logger.debug(`Deleted local file: ${absPath}`);
      }
    } catch (err) {
      this.logger.error(`Failed to delete local file: ${fileUrlOrPath}`, err.message);
    }
  }
}
