### Readable - Ai generated comments

These docs will try to better explain how Readable works. 

## Resync
Readable uses the Resync executable to find out if sync comments. When Readable is first laughed, resync is downloaded. Resync is executed whenever a new project is opened, or whenever the user saves or changes their active file. The output from Resync is then parsed, and used with Readable.

See `src/resync/index.ts` to see how resync works.
