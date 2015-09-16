class Cropper {
  constructor(cropperID, cropperName, aspectRatio, fileNumber) {
    this.cropperID = cropperID;
    this.name = cropperName;
    this.aspectRatio = aspectRatio;
    this.fileNumber = fileNumber;
  }
  destroy() {
    // this._cropper.destroy();
  }
  start() {
    this._cropper = $(`.${this.cropperID} > img`).cropper({
      aspectRatio: this.aspectRatio,
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
  getData() {
    return this._cropper.cropper('getData');
  }
  hide() {
    $(`.${this.cropperID}`).hide();
  }
  show() {
    $(`.${this.cropperID}`).show();
    $('#fileUploaderTitle').html(`Cropper ${this.fileNumber}: ${this.name}`)
  }
  getImgId() {
    return $(`.${this.cropperID}`).data('imgid');
  }
}

export class FileUploader {

  _showCroppers() {

    let globalCounter = 0;

    this.uploadedImages.forEach((uploadedFile, i) => {

      this.croppers.forEach((cropperRequest, j) => {
        const counter = globalCounter;
        const cropperID = `cropper--${i}--${j}`;
        const imgID = `img--${cropperID}`;
        const img = `<img id="${imgID}" src="${this.uploadedImages[i].url}" style="width: 100%" />`;
        const div = `<div class='${cropperID}' data-imgid="${this.uploadedImages[i]._id}" style="display: none">${img}</div>`;

        $(this.fileUploaderContainer).append(div);
        $(`#${imgID}`).load(() => {
          this.cropperInstances[counter] = new Cropper(cropperID, cropperRequest.name, cropperRequest.value, i);
          if(counter === 0) {
            this.cropperInstances[counter].show();
            this.cropperInstances[counter].start();
            $('#nextBtn').removeClass('hidden');
          }
        });

        globalCounter++;

      });

    });

    // init next btn
    $('#nextBtn').on('click', e => {
      this.uploadedImagesMetadata[this.currentIndex] = this.cropperInstances[this.currentIndex].getData();
      if (!this.cropperInstances[this.currentIndex+1]) {

        const filesMetadata = {};
        const metadataName = this.metadataName;

        // Sending the data to the server
        this.uploadedImagesMetadata.forEach((data, index) => {
          this.uploadedImagesMetadata[index]._id = this.cropperInstances[index].getImgId();
          if (!filesMetadata[this.cropperInstances[index].name]) filesMetadata[this.cropperInstances[index].name] = [];
          filesMetadata[this.cropperInstances[index].name].push(this.uploadedImagesMetadata[index]);
        });

        $.ajax({
          url: this.metadataApiPath,
          method: 'PUT',
          contentType: 'application/json',
          dataType: 'json',
          data: JSON.stringify({files: filesMetadata, metadata_name: metadataName}),
          beforeSend(xhr){
            xhr.setRequestHeader('csrf-token', window.csrf);
          },
          success: function(data, textStatus, jqXHR) {
            location.reload();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            // Print the errors to the console
            console.error(`${jqXHR.responseJSON[0].msg}.`);

            // TODO: Show errors to the user
          }
        });

      } else {
        this.cropperInstances[this.currentIndex].hide();
        this.cropperInstances[this.currentIndex+1].show();
        this.cropperInstances[this.currentIndex+1].start();
        this.currentIndex++;
      }
    });
  }

  constructor(fileUploaderContainer, fileUploaderMediaController, opts) {

    opts = opts || {};
    if(!fileUploaderContainer) throw new Error('fileUploaderContainer is mandatory.');

    // Ref
    const self = this;

    // Options
    this.metadataName = opts.metadataName || 'cropper';
    this.fileUploaderContainer = fileUploaderContainer;
    this.fileUploaderMediaController = fileUploaderMediaController;
    this.uploaderApiPath = opts.uploaderApiPath || '/api/files';
    this.metadataApiPath = opts.metadataApiPath || '/api/files/metadata';
    this.maxFileSize = opts.maxFileSize || undefined;
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
      <input id="fileupload" type="file" name="files[]" multiple="" accept="${this.acceptFileTypes ? this.acceptFileTypes : ''}">
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
    $(this.fileUploaderContainer).append(html);
    $(this.fileUploaderMediaController).append(`${closeBtn}${nextBtn}`);

    this._uploader = $('#fileupload').fileupload({
      url: this.uploaderApiPath,
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

        $('#closeBtn').addClass('hidden');

        // Show croppers
        self._showCroppers();
      }
    })
    .prop('disabled', !$.support.fileInput)
    .parent().addClass($.support.fileInput ? undefined : 'disabled');

  }
}
