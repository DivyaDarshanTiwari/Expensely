// useHasMountedOnce.ts
import { useRef, useEffect } from "react";

export function useHasMountedOnce() {
  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  return hasMounted.current;
}
