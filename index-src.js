class Cropper {
  constructor(cropperID, cropperName, aspectRatio, fileNumber) {
    this.cropperID = cropperID;
    this.name = cropperName;
    this.aspectRatio = aspectRatio;
    this.fileNumber = fileNumber + 1;
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

    const self = this;

    let globalCounter = 0;

    this.tabsContainer = $(`<div class="tab-content"></div>`)
    this.tabsButtons = $(`<ul class="nav nav-tabs" role="tablist"></ul>`)
    $(this.fileUploaderContainer).append(this.tabsButtons)
    $(this.fileUploaderContainer).append(this.tabsContainer)
    $('#nextBtn').removeClass('hidden')


    this.uploadedImages.forEach((uploadedFile, i) => {

      this.croppers.forEach((cropperRequest, j) => {
        const counter = globalCounter;
        const cropperID = `cropper--${i}--${j}`;
        const imgID = `img--${cropperID}`;
        const img = `<img id="${imgID}" src="${this.uploadedImages[i].url}" style="width: 100%" />`;
        const div = `<div role='tabpanel' class='${cropperID} tab-pane ${j==0 ? 'active' : ''}' id='pane-${cropperID}' data-imgid="${this.uploadedImages[i]._id}">${img}</div>`;
        const tab = `<li role="presentation" class="${j==0 ? 'active' : ''}"><a href="#pane-${cropperID}" aria-controls="${cropperID}" role="tab" data-toggle="tab">${cropperRequest.name.replace('-', ' ')}</a></li>`

        $(this.tabsContainer).append(div);
        $(this.tabsButtons).append(tab);
        $(`#${imgID}`).load(() => {
          this.cropperInstances[counter] = new Cropper(cropperID, cropperRequest.name, cropperRequest.value, i);
          this.cropperInstances[counter].start();
        });

        globalCounter++;

      });

    });

    // init next btn
    $('#nextBtn').on('click', e => {
      this.uploadedImagesMetadata = this.cropperInstances.map(cropper => {
        return cropper.getData()
      })

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
          if(self.done) {
            return self.done();
          }
          location.reload();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          // Print the errors to the console
          console.error(`${jqXHR.responseJSON[0].msg}.`);

          // TODO: Show errors to the user
        }
      });

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
    this.done = opts.done || undefined;

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
    const nextBtn = `<button id="nextBtn" class="btn btn-success hidden" type="button"> Save & Close </button>`;

    // Append elements to DOM
    $(this.fileUploaderContainer).append(html);
    $(this.fileUploaderMediaController).append(`${nextBtn}${closeBtn}`);

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

        if (!self.croppers && self.done) {
          return self.done();
        } else if (!self.croppers) {
          return location.reload();
        }

        // Filter images only
        self.uploadedFiles.forEach((uploadedFile, index) => {
          if(['image/jpeg', 'image/jpg', 'image/gif', 'image/png'].indexOf(uploadedFile.mimetype) > -1) {
            self.uploadedImages.push(uploadedFile);
          }
        });

        if (self.uploadedImages.length === 0 && self.done) {
          return self.done();
        } else if (self.uploadedImages.length === 0) {
          return location.reload();
        }

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
