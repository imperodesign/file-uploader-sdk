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
```html
```

```js
const FileUploader = require('file-uploader-sdk').FileUploader;
const FileUploaderInstance = new FileUploader({
  maxFileSize: 999000,
  acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i, // default: no restriction
  croppers: [16/9, 4/3, 1/1]
});
```


# Server-side
This module has been create for the [CLEVER](https://github.com/imperodesign/clever) project. Therefore has been designed to use the [clever-files](https://github.com/imperodesign/clever-files) package API. However, it should be compatible with a custom made version of the [jQuery-File-Upload server scripts](https://github.com/blueimp/jQuery-File-Upload/tree/master/server) (since resizing and cropping information are saved into a database for being used later with [thumbor](https://github.com/thumbor/thumbor)).
