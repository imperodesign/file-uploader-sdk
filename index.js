'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Cropper = (function () {
  function Cropper(cropperID, cropperName, aspectRatio, fileNumber) {
    _classCallCheck(this, Cropper);

    this.cropperID = cropperID;
    this.name = cropperName;
    this.aspectRatio = aspectRatio;
    this.fileNumber = fileNumber + 1;
  }

  _createClass(Cropper, [{
    key: 'destroy',
    value: function destroy() {
      // this._cropper.destroy();
    }
  }, {
    key: 'start',
    value: function start() {
      this._cropper = $('.' + this.cropperID + ' > img').cropper({
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
  }, {
    key: 'getData',
    value: function getData() {
      return this._cropper.cropper('getData');
    }
  }, {
    key: 'hide',
    value: function hide() {
      $('.' + this.cropperID).hide();
    }
  }, {
    key: 'show',
    value: function show() {
      $('.' + this.cropperID).show();
      $('#fileUploaderTitle').html('Cropper ' + this.fileNumber + ': ' + this.name);
    }
  }, {
    key: 'getImgId',
    value: function getImgId() {
      return $('.' + this.cropperID).data('imgid');
    }
  }]);

  return Cropper;
})();

var FileUploader = (function () {
  _createClass(FileUploader, [{
    key: '_showCroppers',
    value: function _showCroppers() {
      var _this = this;

      var self = this;

      var globalCounter = 0;

      this.tabsContainer = $('<div class="tab-content"></div>');
      this.tabsButtons = $('<ul class="nav nav-tabs" role="tablist"></ul>');
      $(this.fileUploaderContainer).append(this.tabsButtons);
      $(this.fileUploaderContainer).append(this.tabsContainer);
      $('#nextBtn').removeClass('hidden');

      this.uploadedImages.forEach(function (uploadedFile, i) {

        _this.croppers.forEach(function (cropperRequest, j) {
          var counter = globalCounter;
          var cropperID = 'cropper--' + i + '--' + j;
          var imgID = 'img--' + cropperID;
          var img = '<img id="' + imgID + '" src="' + _this.uploadedImages[i].url + '" style="width: 100%" />';
          var div = '<div role=\'tabpanel\' class=\'' + cropperID + ' tab-pane ' + (j == 0 ? 'active' : '') + '\' id=\'pane-' + cropperID + '\' data-imgid="' + _this.uploadedImages[i]._id + '">' + img + '</div>';
          var tab = '<li role="presentation" class="' + (j == 0 ? 'active' : '') + '"><a href="#pane-' + cropperID + '" aria-controls="' + cropperID + '" role="tab" data-toggle="tab">' + cropperRequest.name.replace('-', ' ') + '</a></li>';

          $(_this.tabsContainer).append(div);
          $(_this.tabsButtons).append(tab);
          $('#' + imgID).load(function () {
            _this.cropperInstances[counter] = new Cropper(cropperID, cropperRequest.name, cropperRequest.value, i);
            _this.cropperInstances[counter].start();
          });

          globalCounter++;
        });
      });

      // init next btn
      $('#nextBtn').on('click', function (e) {
        _this.uploadedImagesMetadata = _this.cropperInstances.map(function (cropper) {
          return cropper.getData();
        });

        var filesMetadata = {};
        var metadataName = _this.metadataName;

        // Sending the data to the server
        _this.uploadedImagesMetadata.forEach(function (data, index) {
          _this.uploadedImagesMetadata[index]._id = _this.cropperInstances[index].getImgId();
          if (!filesMetadata[_this.cropperInstances[index].name]) filesMetadata[_this.cropperInstances[index].name] = [];
          filesMetadata[_this.cropperInstances[index].name].push(_this.uploadedImagesMetadata[index]);
        });

        $.ajax({
          url: _this.metadataApiPath,
          method: 'PUT',
          contentType: 'application/json',
          dataType: 'json',
          data: JSON.stringify({ files: filesMetadata, metadata_name: metadataName }),
          beforeSend: function beforeSend(xhr) {
            xhr.setRequestHeader('csrf-token', window.csrf);
          },
          success: function success(data, textStatus, jqXHR) {
            if (self.done) {
              return self.done();
            }
            location.reload();
          },
          error: function error(jqXHR, textStatus, errorThrown) {
            // Print the errors to the console
            console.error(jqXHR.responseJSON[0].msg + '.');

            // TODO: Show errors to the user
          }
        });
      });
    }
  }]);

  function FileUploader(fileUploaderContainer, fileUploaderMediaController, opts) {
    _classCallCheck(this, FileUploader);

    opts = opts || {};
    if (!fileUploaderContainer) throw new Error('fileUploaderContainer is mandatory.');

    // Ref
    var self = this;

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

    var html = '<span class="btn btn-success fileinput-button">\n      <i class="glyphicon glyphicon-plus"></i><span>Select files...</span>\n      <input id="fileupload" type="file" name="files[]" multiple="" accept="' + (this.acceptFileTypes ? this.acceptFileTypes : '') + '">\n    </span>\n    <br>\n    <br>\n    <div id="progress" class="progress">\n      <div class="progress-bar progress-bar-success"></div>\n    </div>\n    <div id="files" class="files"></div>';

    var closeBtn = '<button id="closeBtn" class="btn btn-default" type="button" data-dismiss="modal"> Close </button>';
    var nextBtn = '<button id="nextBtn" class="btn btn-success hidden" type="button"> Save & Close </button>';

    // Append elements to DOM
    $(this.fileUploaderContainer).append(html);
    $(this.fileUploaderMediaController).append('' + nextBtn + closeBtn);

    this._uploader = $('#fileupload').fileupload({
      url: this.uploaderApiPath,
      dataType: 'json',
      beforeSend: function beforeSend(xhr) {
        xhr.setRequestHeader('csrf-token', window.csrf);
      },
      success: function success(data) {
        // location.href = '/admin/files';
        self.uploadedFiles = self.uploadedFiles.concat(data);
      },
      progressall: function progressall(e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#progress .progress-bar').css('width', progress + '%');
      },
      stop: function stop(e) {

        if (!self.croppers && self.done) {
          return self.done();
        } else if (!self.croppers) {
          return location.reload();
        }

        // Filter images only
        self.uploadedFiles.forEach(function (uploadedFile, index) {
          if (['image/jpeg', 'image/jpg', 'image/gif', 'image/png'].indexOf(uploadedFile.mimetype) > -1) {
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
    }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
  }

  return FileUploader;
})();

exports.FileUploader = FileUploader;

//# sourceMappingURL=index.js.map