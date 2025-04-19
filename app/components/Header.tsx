"use client"
import Profile from "./Profile"
import { SessionProvider } from "next-auth/react"

import Envirnoment from "./envirnoment/envirnoment"
import Search from "./envirnoment/search"
import Link from "next/link"

export default function Header() {

  return (
    <div className="relative flex items-center justify-between  h-[50px] mt-3">
      <div className="flex items-center gap-x-4 pb-0">
        <SessionProvider>
          <Profile />
        </SessionProvider>
        <Search />
      </div>
      <div className="lg:flex items-center gap-x-3 pb-0 hidden">
        <Link href={'/tasks'} className="px-2 py-[6px] border  hover:bg-stone-100 delay-75 cursor-pointer rounded-md delay-100" >Received Tasks</Link>
        <Envirnoment />
      </div>
    </div>
  )
}