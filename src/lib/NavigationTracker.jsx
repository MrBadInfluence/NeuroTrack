// NavigationTracker is a no-op in the local version.
// It previously logged page views to Base44 analytics.
// Re-implement here if you want local analytics in future.
export default function NavigationTracker() {
  return null;
}
