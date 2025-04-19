"use client"

import React, { useState } from "react"
import { CreateEnvironment } from "./create";
import { AddCollaborator } from "./add";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { DeleteEnvironment } from "./delete";


export default function Envirnoment() {
  const [isOpen, setIsOpen] = useState(0);
  const [isFelter, setIsFelter] = useState(false)
  const [felterText, setFelterText] = useState("Envirnoment")

  const array = [
    { id: 1, name: 'Add' },
    { id: 2, name: 'Create' },
    { id: 3, name: 'Delete' },
  ]
  return (
    <div>
      <div className="px-2 hover:bg-stone-100 delay-75  w-[160px]  rounded-md bg-n2dark border relative my-5 z-50">
        <div className="flex py-[4px] w-full justify-between items-center cursor-pointer mb-1" onClick={() => setIsFelter(prev => !prev)}>
          <h1 className=" text-black mr-2" > {felterText}</h1>
          {isFelter ? <ChevronDown className="animate-pulse " /> : <ChevronUp />}
        </div>
        <div className={`  rounded-md grid transition-all duration-100 overflow-hidden absolute top-12 left-0 w-full shadow-xl bg-white ${isFelter ? 'border' : ''}`} style={{ gridTemplateRows: isFelter ? '1fr' : '0fr' }}>
          <div className={`min-h-0 mt-1 pt-1 ${isFelter ? 'block' : 'hidden'} bg-n2dark border-slate-500 rounded  p-2`}>{array.map(item => {
            return (
              <div key={item.id} onClick={() => {
                setFelterText(item.name)
                setIsFelter(prev => prev = false)
                setIsOpen(item.id)
              }} className={`hover:bg-stone-100 flex justify-between items-center text-black delay-75 my-1 p-1 rounded-md  cursor-pointer bg-dark font-sans `} ><span>{item.name}</span> <span className="text-sm">{item.name === felterText ? <Check size={16} /> : ''}</span></div>
            )
          })}
          </div>
        </div>
      </div>
      {isOpen === 1 && <div className="absolute top-5 left-[50%] -translate-x-1/2 bg-white z-50"><AddCollaborator box={setIsOpen} /></div>}
      {isOpen === 2 && <div className="absolute top-5 left-[50%] -translate-x-1/2 bg-white z-50"><CreateEnvironment box={setIsOpen} /></div>}
      {isOpen === 3 && <div className="absolute top-5 left-[50%] -translate-x-1/2 bg-white z-50"><DeleteEnvironment box={setIsOpen} /></div>}
    </div >
  )
}
