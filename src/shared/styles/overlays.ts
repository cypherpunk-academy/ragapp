import { StyleSheet } from 'react-native';

/** Vollbild-Overlay in der View-Hierarchie (kein UIKit-Modal — vermeidet detached-VC auf iOS). */
export const overlayStyles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'flex-end',
  },
});
