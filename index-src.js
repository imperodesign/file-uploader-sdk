class Cropper {
  constructor(cropperID, aspectRatio) {
    this.cropperID = cropperID;

    this._cropper = $(`.${cropperID} > img`).cropper({
      aspectRatio: aspectRatio,
      autoCropArea: 0.75,
      strict: false,
      guides: true,
      highlight: false,
      dragCrop: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      zoomable: false,
      movable: false
    });
  }
  destroy() {
    // this._cropper.destroy();
  }
  getData() {
    return this._cropper.cropper('getData');
  }
  hide() {
    $(`.${this.cropperID}`).hide();
  }
  show() {
    $(`.${this.cropperID}`).show();
  }
}

export class FileUploader {

  _showCroppers() {

    this.uploadedImages.forEach((uploadedFile, i) => {

      this.croppers.forEach((cropperRequest, j) => {
        const cropperID = `cropper--${i}--${j}`;
        const imgID = `img--${cropperID}`;
        const img = `<img id="${imgID}" src="${this.uploadedImages[i].url}" style="width: 100%" />`;
        let div;
        if(i === 0 && j === 0) {
          div = `<div class='${cropperID}'>${img}</div>`;
        } else {
          div = `<div class='${cropperID}' style="display: none">${img}</div>`;
        }
        $(fileUploaderContainer).append(div);
        $(`#${imgID}`).load(() => {
          this.cropperInstances[i] = new Cropper(cropperID, cropperRequest);
        });
      });

    });

    // init next btn
    $('#nextBtn').on('click', e => {
      this.uploadedImagesMetadata.push(this.cropperInstances[this.currentIndex].getData);
      this.cropperInstances[this.currentIndex].hide();

      if(!this.cropperInstances[this.currentIndex+1]) {
        return console.log(this.uploadedImagesMetadata);
        // return location.reload();
      }

      this.currentIndex++;
    });
  }

  constructor(fileUploaderContainer, fileUploaderMediaController, opts) {

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
    <div id="files" class="files"></div>`;

    const closeBtn = `<button id="closeBtn" class="btn btn-default" type="button" data-dismiss="modal"> Close </button>`;
    const nextBtn = `<button id="nextBtn" class="btn btn-success hidden" type="button"> Save & Next </button>`;

    // Append elements to DOM
    $(fileUploaderContainer).append(html);
    $(fileUploaderMediaController).append(`${closeBtn}${nextBtn}`);

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

        $('#nextBtn').removeClass('hidden');
        $('#closeBtn').addClass('hidden');

        // Show croppers
        self._showCroppers();
      }
    })
    .prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');

  }
}
