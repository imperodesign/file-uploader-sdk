class Cropper {
  constructor(domElement, aspectRatio) {
    this._cropper = $(domElement).cropper({
      aspectRatio: aspectRatio,
      autoCropArea: 0.65,
      strict: false,
      guides: false,
      highlight: false,
      dragCrop: false,
      cropBoxMovable: true,
      cropBoxResizable: true
    });
  }
  destroy() {
    // this._cropper.destroy();
  }
  getData() {
    return this._cropper.cropper('getData');
  }
}

export class FileUploader {

  _showCroppers() {

    this.uploadedImages.forEach((uploadedFile, i) => {

      this.croppers.forEach((cropperRequest, j) => {
        let img;
        const imgID = `cropper--${this.i}--${this.j}`;
        if(i === 0 && j === 0) {
          img = `<img id='cropper--${imgID}' src="${this.uploadedImages[this.currentIndex].url}" style="width: 100%" />`;
        } else {
          img = `<img id='cropper--${imgID}' src="${this.uploadedImages[this.currentIndex].url}" style="width: 100%; display: none" />`;
        }
        $(fileUploaderContainer).append(img);
        this.cropperInstances.push(new Cropper(`#${imgID}`, cropperRequest));
      });

    });

    // init next btn
    $('#nextBtn').on('click', e => {
      if(this.cropperInstances.length === this.currentIndex) {
        alert('done')
        return console.log(this.uploadedImagesMetadata);
        // return location.reload();
      }

      this.uploadedImagesMetadata.push(this.cropperInstances[this.currentIndex].getData);

      this.currentIndex++;

    });
  }

  constructor(fileUploaderContainer, opts) {

    opts = opts || {};
    if(!fileUploaderContainer) throw new Error('fileUploaderContainer is mandatory.');

    // Ref
    const self = this;

    // Options
    this.fileUploaderContainer = fileUploaderContainer;
    this.maxFileSize = opts.maxFileSize || -1;
    this.acceptFileTypes = opts.acceptFileTypes || undefined;
    this.croppers = opts.croppers || undefined;

    this.uploadedFiles = [];

    // Cropper stuff
    this.currentIndex = 0;
    this.uploadedImages = [];
    this.uploadedImagesMetadata = [];
    this.cropperInstances = [];

    // TODO: Check file mimetypes
    // TODO: Check filesize (should be done backend maybe)

    let html = `<span class="btn btn-success fileinput-button">
      <i class="glyphicon glyphicon-plus"></i><span>Select files...</span>
      <input id="fileupload" type="file" name="files[]" multiple="">
    </span>
    <br>
    <br>
    <div id="progress" class="progress">
      <div class="progress-bar progress-bar-success"></div>
    </div>
    <div id="files" class="files"></div>`

    $(fileUploaderContainer).append(html);

    this._uploader = $('#fileupload').fileupload({
      url: `/api/files`,
      dataType: 'json',
      beforeSend(xhr){
        xhr.setRequestHeader('csrf-token', window.csrf);
      },
      success(data) {
        // location.href = '/admin/files';
        self.uploadedFiles = self.uploadedFiles.concat(data);
      },
      progressall(e, data) {
        const progress = parseInt(data.loaded / data.total * 100, 10);
        $('#progress .progress-bar').css('width', progress + '%');
      },
      stop(e) {

        if(!self.croppers) return location.reload();

        // Filter images only
        self.uploadedFiles.forEach((uploadedFile, index) => {
          if(['image/jpeg', 'image/jpg', 'image/gif', 'image/png'].indexOf(uploadedFile.mimetype) > -1) {
            self.uploadedImages.push(uploadedFile);
          }
        });

        if(self.uploadedImages.length === 0) return location.reload();

        // Destroy the uploader
        $('#fileupload').fileupload('destroy');
        $(fileUploaderContainer).empty();

        // Show croppers
        self._showCroppers();
      }
    })
    .prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');

  }
}
