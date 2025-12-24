import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class UploadController {

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Body('conversationId') conversationId: string
    ) {
        return {
            url: `url/${file.filename}`,
            fileName: file.originalname,
            fileSize: `${file.size}`
        }
    }

}
