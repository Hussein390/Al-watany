'use client'

import { useEffect, useState } from 'react';
import Tables from "./components/Tables";
import CreateTask from "./components/delivery/create";

export default function Home() {
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("userRole");
    if (stored) {
      setIsAllowed(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="lg:w-[1200px] container mx-auto mt-8">
      {isAllowed === true ? <Tables /> : isAllowed === false ? <CreateTask /> : null}
    </div>
  );
}
