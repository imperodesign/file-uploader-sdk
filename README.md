A file uploader sdk based on [jQuery-File-Upload](https://github.com/blueimp/jQuery-File-Upload). It supports resize and crop functionalities on images.


# Background

Let's suppose we want upload one or many images and for each of these we want generating different cropped versions.
This module allows an application to upload files (images or not), and in case of images, it allows to initialize `n` croppers on each image uploaded, generating so `n` different cropped image versions (based on the original uploaded image).


# Client-side

## Prerequisites
Include in your html page both `js` and `css` files from the following packages:
- [Bootstrap](http://getbootstrap.com/)
- [jQuery](https://github.com/jquery/jquery)
- [jQuery-UI](https://github.com/jquery/jquery-ui)
- [jQuery-File-Upload](https://blueimp.github.io/jQuery-File-Upload)
- [Cropper](http://fengyuanchen.github.io/cropper/)

## Install
```sh
$ npm install --save file-uploader-sdk
```

## Usage
The HTML you need to include in your code is `<div id="fileUploaderContainer" class="..."></div>` and `<button id="nextBtn" ... />`.
The `nextBtn` is only if you want upload images and cropper them. You can be inspired by the following snippet:

```html
<div id="uploadFilesModal" tabindex="-1" role="dialog" aria-labelledby="uploadFilesModalLabel" class="modal fade in" aria-hidden="false" style="display: block;">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" data-dismiss="modal" aria-label="Close" class="close"><span aria-hidden="true">×</span></button>
        <h4 id="fileUploaderTitle" class="modal-title">Upload Files</h4></div>
      <div id="fileUploaderContainer" class="modal-body">
        <!-- UPLOADER -->
      </div>
      <div class="modal-footer">
        <button id="closeBtn" type="button" data-dismiss="modal" class="btn btn-default">Close</button>
        <button id="nextBtn" type="button" data-dismiss="modal" class="btn btn-default">Next</button>
      </div>
    </div>
  </div>
</div>
```

```js
const FileUploader = require('file-uploader-sdk').FileUploader;
const FileUploaderInstance = new FileUploader('#fileUploaderContainer', {
  maxFileSize: 999000,
  acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i, // default: no restriction
  croppers: [16/9, 4/3, 1/1]
});
```


# Server-side
This module has been create for the [CLEVER](https://github.com/cleverframework/clever) project. Therefore has been designed to use the [clever-v0-files](https://github.com/cleverframework/clever-v0-files) package API. However, it should be compatible with a custom made version of the [jQuery-File-Upload server scripts](https://github.com/blueimp/jQuery-File-Upload/tree/master/server) (since resizing and cropping information are saved into a database for being used later with [thumbor](https://github.com/thumbor/thumbor)).

### IMPORTANT
The latest npm `file-uploader-skd` version compatible with [clever-v0-files](https://github.com/cleverframework/clever-v0-files) is the `0.0.5`. If you want to import it manually, please use the git release `v1.0.0-rc1`. 
