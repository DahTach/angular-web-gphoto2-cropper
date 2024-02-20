/// <reference types="w3c-web-usb" />
import { Component, ViewChild, ElementRef, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Camera } from '../web-gphoto2/camera';
import { CommonModule } from '@angular/common';
import { CropComponent } from './crop/crop.component';
import { DomSanitizer } from '@angular/platform-browser';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, CropComponent,],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'GphotoJs';

  constructor(private elementRef: ElementRef, @Inject(DomSanitizer) private sanitizer: DomSanitizer
  ) {
    this.previewCanvas = elementRef.nativeElement.querySelector('canvas')
    this.captureCanvas = elementRef.nativeElement.querySelector('canvas')
    this.imageUploader = elementRef.nativeElement.querySelector('input')
    this.crop = elementRef.nativeElement.querySelector('app-crop')
  }

  @ViewChild('preview_canvas', { static: true }) previewCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('capture_canvas', { static: true }) captureCanvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('imageUploader', { static: true }) imageUploader: ElementRef<HTMLInputElement>;
  @ViewChild('app-crop') public crop: CropComponent;

  camera: Camera = new Camera
  connection: number = 0
  device: any
  preview: boolean = false
  ms: number = 2000
  delay = new Promise(res => setTimeout(res, this.ms));


  async showWebUSB() {
    const filters: any = [];
    this.device = await navigator.usb.requestDevice({ 'filters': filters });
    console.log(this.device)
    await this.connectCamera();
  }

  async connectCamera() {
    /** @type {Camera} */
    try {
      await this.camera.connect();
      this.connection = 1
    } catch (e) {
      console.warn(e);
    }
  }

  async togglePreview(target?: boolean) {
    if (target !== undefined) {
      this.preview = target
    }
    else {
      this.preview = !this.preview;
      if (this.preview == true) {
        if (this.connection == 1) {
          this.streamPreview()
        }
        else {
          await this.delay;
          console.log('No Camera Connected')
        }
      }
    }
    console.log(this.preview ? 'preview is on' : 'preview is off');

  }

  async streamPreview() {
    do {
      if (this.connection == 1) {
        try {
          let blob = await this.camera.capturePreviewAsBlob();
          await new Promise(resolve => requestAnimationFrame(resolve));
          this.drawCanvas(blob, this.previewCanvas)
        } catch (err) {
          console.error('Could not refresh preview:', err);
        }
      }
      else {
        await this.delay;
      }
    }
    while (this.preview == true)

  }

  async captureImage() {
    await this.togglePreview(false)
    if (this.connection == 1) {
      try {
        const capture_blob = await this.camera.captureImageAsFile();
        await this.drawCanvas(capture_blob, this.captureCanvas)
        this.mimeType = null
        try {
          this.getBlobMimeType(capture_blob)
        } catch (error) {
          this.mimeType = capture_blob.type
          console.log('Could not check mimeType for captured image, fallback to default:', this.mimeType, '\n Error: ', error)
        }

        //let dataUrl = await this.blobToDataURL(capture_blob)
        //this.drawCropperImage(dataUrl)
      }
      catch (err) {
        console.error('Could not capture image:', err);
      }
    }
    else {
      console.log('No Camera Connected')
    }
  }

  // blobToDataURL(blob: Blob): Promise<string> {
  //   return new Promise<string>((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.onload = _e => resolve(reader.result as string);
  //     reader.onerror = _e => reject(reader.error);
  //     reader.onabort = _e => reject(new Error("Read aborted"));
  //     reader.readAsDataURL(blob);
  //   });
  // }

  async drawCanvas(data: Blob, canvas: ElementRef<HTMLCanvasElement>) {
    try {
      const ctx = canvas.nativeElement.getContext('2d') as CanvasRenderingContext2D;

      let imageBitmap = await createImageBitmap(data);

      if (ctx) {
        ctx.drawImage(
          imageBitmap,
          0,
          0,
          imageBitmap.width,
          imageBitmap.height,
          0,
          0,
          canvas.nativeElement.width,
          canvas.nativeElement.height
        );
      } else {
        console.error('Failed to get canvas context.');
      }
    } catch (error) {
      console.error('Error drawing blob:', error);
    }
  }

  async getBlobMimeType(blob: Blob) {
    const mimetypePromise = this.blobMimeType(blob);
    const mimetype: any = await mimetypePromise; // Wait for the Promise to resolve
    //console.log('File mimetype:', mimetype);
    return mimetype
  }

  blobMimeType(blob: Blob) {
    const slicedBlob = blob.slice(0, 4);

    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        const uint = new Uint8Array(event.target?.result as ArrayBuffer);
        const bytes = [];
        for (const byte of uint) {
          bytes.push(byte.toString(16));
        }
        const hex = bytes.join('').toUpperCase();
        const binaryFileType: string = this.getMimetypeFromSignature(hex);
        resolve(binaryFileType);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
      fileReader.readAsArrayBuffer(slicedBlob);
    });
  }

  getMimetypeFromSignature(signature: string) {
    switch (signature) {
      case '89504E47':
        return 'image/png'
      case '47494638':
        return 'image/gif'
      case '25504446':
        return 'application/pdf'
      case 'FFD8FFDB':
      case 'FFD8FFE0':
      case 'FFD8FFE1':
        return 'image/jpeg'
      case '504B0304':
        return 'application/zip'
      default:
        return 'Unknown filetype'
    }
  }


  // FOR TESTING ON LOCAL IMAGE UPLOAD
  mimeType: string | null = null
  imageUrl: Subject<string | ArrayBuffer | null> = new Subject();


  onImageUpload(event: any) {
    let reader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      let file = event.target.files[0];
      this.mimeType = file.type
      reader.readAsDataURL(file);
      reader.onload = () => {
        //this.imageUrl = reader.result;
        this.imageUrl.next(reader.result);
        console.log('reader result', reader.result)
      };
    }
  }


}
