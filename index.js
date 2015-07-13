'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Cropper = (function () {
  function Cropper(cropperID, cropperName, aspectRatio) {
    _classCallCheck(this, Cropper);

    this.cropperID = cropperID;
    this.name = cropperName;
    this.aspectRatio = aspectRatio;
  }

  _createClass(Cropper, [{
    key: 'destroy',
    value: function destroy() {}
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
  function FileUploader(fileUploaderContainer, fileUploaderMediaController, opts) {
    _classCallCheck(this, FileUploader);

    opts = opts || {};
    if (!fileUploaderContainer) throw new Error('fileUploaderContainer is mandatory.');

    // Ref
    var self = this;

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

    var html = '<span class="btn btn-success fileinput-button">\n      <i class="glyphicon glyphicon-plus"></i><span>Select files...</span>\n      <input id="fileupload" type="file" name="files[]" multiple="">\n    </span>\n    <br>\n    <br>\n    <div id="progress" class="progress">\n      <div class="progress-bar progress-bar-success"></div>\n    </div>\n    <div id="files" class="files"></div>';

    var closeBtn = '<button id="closeBtn" class="btn btn-default" type="button" data-dismiss="modal"> Close </button>';
    var nextBtn = '<button id="nextBtn" class="btn btn-success hidden" type="button"> Save & Next </button>';

    // Append elements to DOM
    $(fileUploaderContainer).append(html);
    $(fileUploaderMediaController).append('' + closeBtn + nextBtn);

    this._uploader = $('#fileupload').fileupload({
      url: '/api/files',
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

        if (!self.croppers) return location.reload();

        // Filter images only
        self.uploadedFiles.forEach(function (uploadedFile, index) {
          if (['image/jpeg', 'image/jpg', 'image/gif', 'image/png'].indexOf(uploadedFile.mimetype) > -1) {
            self.uploadedImages.push(uploadedFile);
          }
        });

        if (self.uploadedImages.length === 0) return location.reload();

        // Destroy the uploader
        $('#fileupload').fileupload('destroy');
        $(fileUploaderContainer).empty();

        $('#closeBtn').addClass('hidden');

        // Show croppers
        self._showCroppers();
      }
    }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
  }

  _createClass(FileUploader, [{
    key: '_showCroppers',
    value: function _showCroppers() {
      var _this = this;

      var globalCounter = 0;

      this.uploadedImages.forEach(function (uploadedFile, i) {

        _this.croppers.forEach(function (cropperRequest, j) {
          var counter = globalCounter;
          var cropperID = 'cropper--' + i + '--' + j;
          var imgID = 'img--' + cropperID;
          var img = '<img id="' + imgID + '" src="' + _this.uploadedImages[i].url + '" style="width: 100%" />';
          var div = '<div class=\'' + cropperID + '\' data-imgid="' + _this.uploadedImages[i]._id + '" style="display: none">' + img + '</div>';

          $(fileUploaderContainer).append(div);
          $('#' + imgID).load(function () {
            _this.cropperInstances[counter] = new Cropper(cropperID, cropperRequest.name, cropperRequest.value);
            if (counter === 0) {
              _this.cropperInstances[counter].show();
              _this.cropperInstances[counter].start();
              $('#nextBtn').removeClass('hidden');
            }
          });

          globalCounter++;
        });
      });

      // init next btn
      $('#nextBtn').on('click', function (e) {
        _this.uploadedImagesMetadata[_this.currentIndex] = _this.cropperInstances[_this.currentIndex].getData();
        if (!_this.cropperInstances[_this.currentIndex + 1]) {
          (function () {

            var filesMetadata = {};

            // Sending the data to the server
            _this.uploadedImagesMetadata.forEach(function (data, index) {
              _this.uploadedImagesMetadata[index]._id = _this.cropperInstances[index].getImgId();
              filesMetadata[_this.cropperInstances[index].name] = _this.uploadedImagesMetadata[index];
            });

            $.ajax({
              url: '/api/files/metadata',
              method: 'PUT',
              contentType: 'application/json',
              dataType: 'json',
              data: JSON.stringify({ files: filesMetadata, metadata_name: 'cropper' }),
              beforeSend: function beforeSend(xhr) {
                xhr.setRequestHeader('csrf-token', window.csrf);
              },
              success: function success(data, textStatus, jqXHR) {
                location.reload();
              },
              error: function error(jqXHR, textStatus, errorThrown) {
                // Print the errors to the console
                console.error(jqXHR.responseJSON[0].msg + '.');

                // TODO: Show errors to the user
              }
            });
          })();
        } else {
          _this.cropperInstances[_this.currentIndex].hide();
          _this.cropperInstances[_this.currentIndex + 1].show();
          _this.cropperInstances[_this.currentIndex + 1].start();
          _this.currentIndex++;
        }
      });
    }
  }]);

  return FileUploader;
})();

exports.FileUploader = FileUploader;

// this._cropper.destroy();

//# sourceMappingURL=index.js.map