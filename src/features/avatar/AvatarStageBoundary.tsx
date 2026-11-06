import React from 'react';

interface BoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A GL context can fail on a device without a working renderer. The stage
 * must never take the session down with it, so the failure falls back to the
 * caller's own artwork.
 */
export class AvatarStageBoundary extends React.Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <>{this.props.fallback}</>;
    return this.props.children;
  }
}
