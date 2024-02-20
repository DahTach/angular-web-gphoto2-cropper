import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  Input
} from "@angular/core";
import { CommonModule } from '@angular/common';
import Cropper from 'cropperjs';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-crop',
  standalone: true,
  imports: [CommonModule,],
  templateUrl: './crop.component.html',
  styleUrl: './crop.component.css',
})

export class CropComponent implements OnInit, OnDestroy {

  title = 'cropperjs';

  constructor() {
    this.options = {
      viewMode: 2,
      background: false,
      // checkOrientation: false,
      // aspectRatio: NaN,
      // highlight: true,
      // guides: true,
      // zoomOnWheel: false,
      // movable: false,
      // zoomable: false,
      // cropBoxResizable: true,
      // dragMode: 'crop',
      // autoCrop: false,
      // autoCropArea: 0.8,
      // preview: '',
      // crop(event) {
      //   console.log(event.detail.x);
      //   console.log(event.detail.y);
      //   console.log(event.detail.width);
      //   console.log(event.detail.height);
      //   console.log(event.detail.rotate);
      //   console.log(event.detail.scaleX);
      //   console.log(event.detail.scaleY);
      // },
      // ready(event) {
      //   console.log("CROPPER READY", event);
      // },
    }
  }

  @ViewChild('cropper_image') cropperImage?: ElementRef;


  cropper: Cropper | null = null
  options: Cropper.Options


  resetCrop() {
    this.cropper?.reset()
  }

  clearCrop() {
    this.cropper?.clear()
  }

  saveCrop() {
    // for almost lossless conversion
    //blob.type

    // let imgType
    // if (this.mimeType != null) {
    //   imgType = this.mimeType
    // } else {
    //   imgType = 'image/jpeg'
    // }
    let imgType = 'image/jpeg'
    let imgURL = this.cropper?.getCroppedCanvas({
      fillColor: '#fff',
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'high',
    }).toDataURL(imgType, 0.99)

    if (imgURL) {
      //let filename = `image.${imgType}`
      let filename = 'camadonna.jpeg'
      this.downloadDataUrl(imgURL, filename)
    }

  }

  downloadBlob(blob: Blob, name: '') {
    // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
    const blobUrl = URL.createObjectURL(blob);

    // Create a link element
    const link = document.createElement("a");

    // Set link's href to point to the Blob URL
    link.href = blobUrl;
    link.download = name;

    // Append link to the body
    document.body.appendChild(link);

    // Dispatch click event on the link
    // This is necessary as link.click() does not work on the latest firefox
    link.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );

    // Remove link from body
    document.body.removeChild(link);
  }

  downloadDataUrl(dataUrl: string, filename: string) {

    let link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
    //link.ElementRef.nativeElement.remove()

    URL.revokeObjectURL(dataUrl);
  }


  @Input() mimeType: string = ''
  @Input('imageUrl') imageUrl?: Subject<string | ArrayBuffer | null>

  ngOnInit() {
    this.imageUrl?.subscribe(event => {
      console.log('trying to load Image');
      if (event) { // Make sure event has a value
        this.onImageLoaded(event);
      }
    });
  }

  ngOnDestroy() {
    this.imageUrl?.unsubscribe();
  }

  initCropper(imageUrl: string) {
    if (this.cropperImage) {
      this.cropperImage.nativeElement.src = imageUrl
      this.cropper = new Cropper(this.cropperImage.nativeElement, this.options);
    }
  }

  replaceCropper(imageUrl: string) {
    // Possible only if image has same size as previous
    try {
      this.cropper?.replace(imageUrl, true)
    } catch (Error) {
      console.log('tried replacing cropper imageUrl but:', Error)
    }
  }


  onImageLoaded(imageUrl: any) {
    if (this.cropper && this.cropperImage) {
      this.replaceCropper(imageUrl)
    }
    else if (this.cropperImage) {
      this.initCropper(imageUrl)
    } else {
      console.log('No cropper image found:', this.cropperImage)
      this.cropper?.destroy()
    }

  }

  frozen: boolean = false

  freeze() {
    if (this.frozen == false) {
      this.cropper?.disable()
      this.frozen = true
    } else if (this.frozen == true) {
      this.cropper?.enable()
      this.frozen = false
    }
    console.log(this.frozen)
  }

  moveTimeout: any;
  direction: string[] = ['']
  vertical_motion: number = 0
  horizontal_motion: number = 0

  startMoving(new_direction: string[]) {
    this.direction = new_direction
    this.vertical_motion = 0
    this.horizontal_motion = 0
    if (this.direction.includes('top')) {
      this.vertical_motion = 1
    } else if (this.direction.includes('bottom')) {
      this.vertical_motion = -1
    }
    if (this.direction.includes('right')) {
      this.horizontal_motion = -1
    } else if (this.direction.includes('left')) {
      this.horizontal_motion = 1
    }
    this.moveTimeout = setTimeout(() => {
      this.move(); // Start repeating your action
    }, 1); // Adjust the delay (in milliseconds) if needed
  }

  stopMoving() {
    clearTimeout(this.moveTimeout);
  }

  move() {
    // Your action to be repeated
    this.cropper?.move(this.horizontal_motion, this.vertical_motion)
    console.log('Moving', this.direction, this.horizontal_motion, this.vertical_motion)


    this.moveTimeout = setTimeout(() => {
      this.move(); // Keep repeating
    }, 1); // Adjust the repeat interval (in milliseconds)
  }


  zoomTimeout: any;

  startZooming(z: number) {
    this.moveTimeout = setTimeout(() => {
      this.zoom(z); // Start repeating your action
    }, 30); // Adjust the delay (in milliseconds) if needed
  }

  stopZooming() {
    clearTimeout(this.zoomTimeout);
  }

  zoom(z: number) {
    // z > 0 means zoom In, z < 0 means zoom Out
    this.cropper?.zoom(z)
    console.log('zooming',)


    this.zoomTimeout = setTimeout(() => {
      this.zoom(z); // Keep repeating
    }, 30); // Adjust the repeat interval (in milliseconds)
  }

}
