'use client'
import Tables from "./components/Tables";
import CreateTask from "./components/delivery/create";
import { DataPhones } from "./components/DataProvider";

export default function Home() {
  const { isAllowed } = DataPhones();
  return (
    <div className="lg:w-[1200px] container mx-auto mt-8">
      {isAllowed === true ? <Tables /> : <CreateTask />}
    </div>
  );
}
