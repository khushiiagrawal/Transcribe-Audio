import { useState, useEffect } from "react";

export const useHasBrowser = () => {
  const [hasBrowser, setHasBrowser] = useState(false);

  useEffect(() => {
    setHasBrowser(true);
  }, []);

  return hasBrowser;
};
