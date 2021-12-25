# Readable - Instantly Comment Your Code

![Readable Demo](./assets/final_video.gif)

Comment Autocomplete in your IDE. Just type "//", and get a comment written.

## Features

- Save time writing comments with autocomplete suggestions (just type //, or # in Python)
- Works in 7 languages
    - Typescript
    - Javascript
    - Python
    - C#
    - C++
    - Java
    - PHP

## Getting Set Up

Thanks for trying out Readable!

When you first install Readable, you will be prompted to log in or create an account. Readable supports two forms of authentication: GitHub Login and Email.

Once you log in with GitHub or create an account, comment autocomplete will be active. In order to get a comment suggestion, just type "//" on languages with C-Style comments, or "#" on Python.

Readable currently supports the following languages:
* Typescript
* Javascript
* Python
* C#
* C++
* Java
* PHP

If you would like to enable/disable comment suggestions, then you can run "Readable: Enable Comment Suggestions", or "Readable: Disable Comment Suggestions" via the command palette.

NOTE: Readable tries to mimick the style of your current comments, so if you want a specific "style" of comments, then all you have to do is document your code to give Readable examples to choose from.

## Requirements

- VSCode
- An internet connection whenever you want comment autocomplete

## Extension Settings

You can configure the following settings:

- `readable.enableAutoComplete`: enable/disable comments

## Known Issues

When pressing space after typing //, you do not get a comment suggestion. The way VSCode handles intellisense is the reason this happens.

## Release Notes

See [CHANGELOG.md](/CHANGELOG.md)

### Contact

Please email support@readable.so for any questions you may have about the extension. We read all emails, and will get back to you as soon as possible.

2021, Puri Chapman Software
