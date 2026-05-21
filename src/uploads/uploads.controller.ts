import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from './uploads.service';

@Controller('vehicles/:id/photos')
export class UploadsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('photos', 10, {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const dir = join('uploads', 'vehicles', String(req.params['id']));
          require('fs').mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Tipo de arquivo não permitido'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE_MB ?? '5') * 1024 * 1024 },
    }),
  )
  async uploadPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new BadRequestException('Veículo não encontrado');

    const isR2 = this.uploadsService.isR2Enabled();
    const newUrls: string[] = [];

    if (isR2) {
      // Upload para Cloudflare R2
      for (const file of files) {
        const key = `vehicles/${id}/${file.filename}`;
        try {
          const r2Url = await this.uploadsService.uploadFileToR2(
            file.path,
            key,
            file.mimetype,
          );
          newUrls.push(r2Url);
        } catch (error) {
          // Em caso de falha em lote, tentar apagar arquivos locais criados pelo Multer que sobraram
          for (const f of files) {
            try {
              if (require('fs').existsSync(f.path)) {
                require('fs').unlinkSync(f.path);
              }
            } catch {}
          }
          throw new BadRequestException(`Falha ao subir imagem para nuvem: ${error.message}`);
        }
      }
    } else {
      // Armazenamento local padrão
      files.forEach((file) => {
        newUrls.push(`/uploads/vehicles/${id}/${file.filename}`);
      });
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        photos: [...vehicle.photos, ...newUrls],
        history: {
          create: {
            action: `${files.length} foto(s) adicionada(s)`,
          },
        },
      },
    });

    return updated;
  }

  @Delete(':photoIndex')
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoIndex', ParseIntPipe) photoIndex: number,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new BadRequestException('Veículo não encontrado');

    if (photoIndex < 0 || photoIndex >= vehicle.photos.length) {
      throw new BadRequestException('Índice de foto inválido');
    }

    const photoUrl = vehicle.photos[photoIndex];
    // Deleta da nuvem se R2 ou do disco se local
    await this.uploadsService.deleteFile(photoUrl);

    const newPhotos = vehicle.photos.filter((_, i) => i !== photoIndex);
    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        photos: newPhotos,
        history: { create: { action: 'Foto removida' } },
      },
    });

    return updated;
  }
}
