/**
 * Safe navigation back helper for Expo Router.
 *
 * Prevents the React Navigation warning:
 * "The action 'GO_BACK' was not handled by any navigator. Is there any screen to go back to?"
 * which occurs on Web when a user opens a screen directly or refreshes the browser,
 * leaving an empty navigator history stack.
 */

export interface RouterLike {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
}

export function safeBack(router: RouterLike, fallback: string = '/(tabs)'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
