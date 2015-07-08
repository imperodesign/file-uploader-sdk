'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Cropper = (function () {
  function Cropper(cropperID, aspectRatio) {
    _classCallCheck(this, Cropper);

    this.cropperID = cropperID;

    this._cropper = $('.' + cropperID + ' > img').cropper({
      aspectRatio: aspectRatio,
      autoCropArea: 0.65,
      strict: false,
      guides: true,
      highlight: false,
      dragCrop: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      zoomable: false
    });
  }

  _createClass(Cropper, [{
    key: 'destroy',
    value: function destroy() {}
  }, {
    key: 'getData',
    value: function getData() {
      return this._cropper.cropper('getData');
    }
  }, {
    key: 'hide',
    value: function hide() {
      $('.' + cropperID).hide();
    }
  }, {
    key: 'show',
    value: function show() {
      $('.' + cropperID).show();
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

    var closeBtn = '<button class="btn btn-default" type="button" data-dismiss="modal"> Close </button>';
    var nextBtn = '<button class="btn btn-success hidden" type="button"> Save & Next </button>';

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

        $;

        // Show croppers
        self._showCroppers();
      }
    }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
  }

  _createClass(FileUploader, [{
    key: '_showCroppers',
    value: function _showCroppers() {
      var _this = this;

      this.uploadedImages.forEach(function (uploadedFile, i) {

        _this.croppers.forEach(function (cropperRequest, j) {
          var cropperID = 'cropper--' + i + '--' + j;
          var imgID = 'img--' + cropperID;
          var img = '<img id="' + imgID + '" src="' + _this.uploadedImages[_this.currentIndex].url + '" style="width: 100%" />';
          var div = undefined;
          if (i === 0 && j === 0) {
            div = '<div class=\'' + cropperID + '\'>' + img + '</div>';
          } else {
            div = '<div class=\'' + cropperID + '\' style="display: none">' + img + '</div>';
          }
          $(fileUploaderContainer).append(div);
          $('#' + imgID).load(function () {
            _this.cropperInstances.push(new Cropper(cropperID, cropperRequest));
          });
        });
      });

      // init next btn
      $('#nextBtn').on('click', function (e) {
        _this.uploadedImagesMetadata.push(_this.cropperInstances[_this.currentIndex].getData);
        _this.cropperInstances[_this.currentIndex].hide();

        if (!_this.cropperInstances[_this.currentIndex + 1]) {
          alert('done');
          return console.log(_this.uploadedImagesMetadata);
          // return location.reload();
        }

        _this.currentIndex++;
      });
    }
  }]);

  return FileUploader;
})();

exports.FileUploader = FileUploader;

// this._cropper.destroy();

//# sourceMappingURL=index.js.map