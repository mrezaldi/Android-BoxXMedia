# Android-BoxXMedia

This is my first android app which I made for learning to implementing library like exoplayer

This app has some features like playing video and audio from local and playing audio and video which using internet connection
and the last but not the least I add a lot of bugs as one of features wkwkwk.

Happy Coding :)

---

## React Native rewrite

The app has been ported to React Native — Expo SDK 58, React Native 0.88 and TypeScript (strict).
The rewrite lives in [`mobile/`](mobile/README.md) and covers the same feature set:

- play audio and video stored on the device (was `MediaStore` + ExoPlayer);
- save URL audio/video entries and stream them, with add / edit / delete (was SQLite + ExoPlayer);
- background audio with lock screen / notification controls (was `SongService` + `MediaSession`);
- share a saved entry (was an `ACTION_SEND` intent).

Start with [`mobile/README.md`](mobile/README.md): it has the screen-by-screen mapping from the Java
classes, a list of the original bugs that were fixed, the improvements made, what was verified and
what was not, and the known limitations.

```bash
cd mobile
npm install
npx expo run:android   # development build; background audio and media permissions need native config
```

The Android/Java project is untouched at the repository root (`app/`, `build.gradle`, `gradle/`), so
both implementations can be compared side by side.
