import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for handling swipe gestures on mobile devices
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Minimum distance (in px) to trigger a swipe (default: 50)
 * @param {number} options.timeout - Maximum time (in ms) for the swipe gesture (default: 500)
 * @param {function} options.onSwipeLeft - Callback when swiping left
 * @param {function} options.onSwipeRight - Callback when swiping right
 * @param {function} options.onSwipeUp - Callback when swiping up
 * @param {function} options.onSwipeDown - Callback when swiping down
 * @returns {Object} - Touch event handlers and swipe state
 */
export default function useSwipeGesture({
  threshold = 50,
  timeout = 500,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enabled = true
} = {}) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const timeoutRef = useRef(null);

  // Reset state
  const reset = useCallback(() => {
    setTouchStart(null);
    setTouchEnd(null);
    setSwiping(false);
    setSwipeDirection(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Handle touch start
  const onTouchStart = useCallback((e) => {
    if (!enabled) return;

    reset();
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setSwiping(true);

    // Set timeout to reset if gesture takes too long
    timeoutRef.current = setTimeout(() => {
      reset();
    }, timeout);
  }, [enabled, timeout, reset]);

  // Handle touch move
  const onTouchMove = useCallback((e) => {
    if (!enabled || !touchStart) return;

    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY
    });

    // Calculate direction for live feedback
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(deltaY > 0 ? 'down' : 'up');
    }
  }, [enabled, touchStart]);

  // Handle touch end
  const onTouchEnd = useCallback(() => {
    if (!enabled || !touchStart || !touchEnd) {
      reset();
      return;
    }

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const timeDelta = Date.now() - touchStart.time;

    // Check if the gesture was within the timeout
    if (timeDelta > timeout) {
      reset();
      return;
    }

    // Determine if it's a horizontal or vertical swipe
    const isHorizontal = absDeltaX > absDeltaY;
    const distance = isHorizontal ? absDeltaX : absDeltaY;

    // Only trigger if distance exceeds threshold
    if (distance >= threshold) {
      if (isHorizontal) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    reset();
  }, [enabled, touchStart, touchEnd, threshold, timeout, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swiping,
    swipeDirection,
    reset
  };
}

/**
 * Get the swipe delta for animation purposes
 * @param {Object} touchStart - Starting touch position
 * @param {Object} touchEnd - Ending touch position
 * @returns {Object} - Delta x and y values
 */
export function getSwipeDelta(touchStart, touchEnd) {
  if (!touchStart || !touchEnd) return { x: 0, y: 0 };
  return {
    x: touchEnd.x - touchStart.x,
    y: touchEnd.y - touchStart.y
  };
}
