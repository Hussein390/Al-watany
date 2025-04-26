'use client'
import { DataPhones } from "./components/DataProvider";
import Tables from "./components/Tables";
import CreateTask from "./components/delivery/create";

export default function Home() {
  const { isAllowed } = DataPhones()

  return (
    <div className="lg:w-[1200px] container mx-auto mt-8">
      {isAllowed === true ? <Tables /> : <CreateTask />}
    </div>
  );
}
