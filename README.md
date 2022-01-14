# Save Time Writing Comments With Ai Comment Suggestions

Readable is a VSCode extension which writes comments for you. Using **GPT-3**, you're able to get detailed comment suggestions through intellisense.

![Readable Demo](https://github.com/ReadableLabs/readable/blob/main/output.gif?raw=true)

Just start writing a comment, and get a suggestion.

#

## Ai Generated Comments and Docstrings

Readable generates both inline comments, as well as docstrings.

## Works in 7 Languages

- Typescript
- Javascript
- Python
- C#
- C++
- Java
- PHP

## Privacy

At Readable, we do not store your code, or use it to train any of our models.

Note: As we use GPT-3, OpenAi may store your code, so make sure to read their privacy policy if you are unsure.

## Getting Set Up

Thanks for trying out Readable!

When you first install Readable, you will be prompted to log in or create an account. Readable supports two forms of authentication: GitHub Login and Email.

Once you log in with GitHub or create an account, comment autocomplete will be active. In order to get a comment suggestion, just type "//" on languages with C-Style comments, or "#" on Python.

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

## [1.2.8]

- Made comment suggestions faster

### Contact

Please email support@readable.so for any questions you may have about the extension. We read all emails, and will get back to you as soon as possible.

2021, Puri Chapman Software
