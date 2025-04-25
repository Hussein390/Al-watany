'use client'
import React, { useEffect, useState } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,

} from "@/components/ui/table"

import { CreateDeliveryTask, DataPhones } from './DataProvider'
import { GET_COLLABORATORS, UPDATE_DELIVERY_TASK } from '@/backend/delivery';
import { supabase } from '@/supabase';
import { EllipsisVertical } from 'lucide-react';
import TablesCURD from './TablesCURD';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';


enum Region {
  المناطق = "المناطق",
  بلديات = "بلديات",
  اليرموك = "اليرموك",
  فلسطين = "شالرع فلسطين",
}
type Collaborator = {
  id: string;
  user: { name: string };
  role: string;
};

export default function Tables() {
  const { tasks, setTasks, showAlert, getTasks } = DataPhones();
  const [openImg, setOpenImg] = useState<boolean[]>(Array(tasks.length).fill(false));
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<CreateDeliveryTask>>({});
  const [selectedRegion, setSelectedRegion] = useState<Region | 'المناطق'>('المناطق');
  const [deliveryUsers, setDeliveryUsers] = useState<Collaborator[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('المندوبين');


  useEffect(() => {
    async function fetchDeliveryUsers() {
      const EnvId = localStorage.getItem("envId");
      if (!EnvId) return showAlert("Environment not found", false);
      const collaborators = await GET_COLLABORATORS(EnvId);
      if (collaborators instanceof Error) {
        showAlert(collaborators.message, false);
        return;
      } else if (typeof collaborators === "string") {
        showAlert(collaborators, false);
        return;
      }
      setDeliveryUsers(collaborators as Collaborator[]);
    }

    fetchDeliveryUsers();
  }, []);

  const [isCURD, setIsCURD] = useState<{ [key: string]: boolean }>(() => {
    const initialState: { [key: string]: boolean } = {};
    Array.from({ length: tasks.length }, (_, id) => {
      initialState[id] = false;
    });
    return initialState;
  });
  const handleCURD = (id: number) => {
    setIsCURD((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const channel = supabase
      .channel('delivery-task-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Dilvered' },
        (payload) => {
          const eventType = payload.eventType;
          const newTask = {
            ...payload.new,
            user: { name: (payload.new as CreateDeliveryTask).user?.name }
          } as CreateDeliveryTask;
          const oldTask = {
            ...payload.old,
            user: { name: (payload.old as CreateDeliveryTask).user?.name }
          } as CreateDeliveryTask;
          setTasks((prev) => {
            if (eventType === 'INSERT') {
              return [newTask, ...prev];
            } else if (eventType === 'UPDATE') {
              return prev.map((task) => (task.id === newTask.id ? newTask : task));
            } else if (eventType === 'DELETE') {
              return prev.filter((task) => task.id !== oldTask.id);
            }
            return prev;
          });
        }
      )
      .subscribe();
    getTasks();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [setTasks]);

  function OpenIMG(index: number) {
    const newIsOnline = [...openImg];
    newIsOnline[index] = !newIsOnline[index];
    setOpenImg(newIsOnline);
  }
  function isOnline(taskId: string, index: number) {
    const updated = { ...editedValues, isOnline: true };
    setEditedValues(updated);
    handleUpdate(taskId, index, updated); // pass it explicitly
  }
  async function handleUpdate(taskId: string, index: number, values: Partial<CreateDeliveryTask> = editedValues) {
    try {
      const EnvId = localStorage.getItem("envId");
      if (!EnvId) return showAlert("Environment not found", false);

      const updatedTask = await UPDATE_DELIVERY_TASK(taskId, values, EnvId);
      if (updatedTask instanceof Error) {
        showAlert(updatedTask.message, false);
        setEditingRowIndex(null);
        return;
      } else if (typeof updatedTask === "string") {
        showAlert(updatedTask, false);
        setEditingRowIndex(null);
        return;
      }
      getTasks();
      setEditingRowIndex(null);
      setEditedValues({});
      showAlert("Task updated successfully", true);
    } catch (err) {
      showAlert("Failed to update task", false);
    }
  }
  const filteredTasks = tasks.filter(task => {
    if (task.isReceived !== false) return false;
    const regionMatches = selectedRegion === 'المناطق' || task.address === selectedRegion;
    const userMatches = selectedUser === 'المندوبين' || task.user?.name === selectedUser;

    return regionMatches && userMatches;
  });
  const todayDate = (createdAt: Date) => {
    const date = new Date(createdAt);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // convert 0 to 12
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${hours}:${minutes} ${ampm} - ${day}/${month}/${year}`;
  }
  return (
    <>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-x-4">
          <Select value={selectedRegion} onValueChange={(value) => setSelectedRegion(value as Region)} >
            <SelectTrigger className="w-[140px] cursor-pointer font-semibold outline-none">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent className='z-40 bg-white'>
              <SelectGroup>
                <SelectLabel className='border-b font-semibold'>المنطقة</SelectLabel>
                {Object.values(Region).map((region, idx) => (
                  <SelectItem className='cursor-pointer hover:bg-stone-200 delay-100' key={idx} value={region}>{region}</SelectItem>
                ))}
              </SelectGroup>

            </SelectContent>
          </Select>
          <Select value={selectedUser} onValueChange={(value) => setSelectedUser(value)} >
            <SelectTrigger className="w-[140px] cursor-pointer font-semibold outline-none">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent className='z-40 bg-white '>
              <SelectGroup>
                <SelectLabel className='border-b font-semibold'>المندوبين</SelectLabel>
                <SelectItem value="المندوبين">المندوبين</SelectItem>
                {deliveryUsers.map((user) => (
                  <SelectItem className='cursor-pointer hover:bg-stone-200 delay-100' key={user.id} value={user.user.name}>
                    {user.user.name}
                  </SelectItem>
                ))}
              </SelectGroup>

            </SelectContent>
          </Select>


        </div>

        <div className="flex gap-x-4 items-center">
          <h1 className='font-semibold'>عدد الطلبات : <span className='text-blue-500 mr-2'>{filteredTasks.length}</span></h1>
          <h1 className='font-semibold'>التوصيلات: <span className='text-blue-500 mr-2'>{filteredTasks.reduce((total, task) => total + (task.deliveryCost || 0), 0).toLocaleString()}</span></h1>
          <h1 className='font-semibold'>المبلغ: <span className='text-blue-500 mr-2'>{filteredTasks.reduce((total, task) => total + (task.price || 0), 0).toLocaleString()}</span></h1>
        </div>
      </div>

      <div className="max-h-[500px] mt-5 overflow-y-auto">
        <Table className='mt-4 overflow-hidden  '>
          <TableHeader className=' border-b-2 border-b-black'>
            <TableRow className=' border-b-4 border-b-black'>
              <TableHead className='text-[16px]'>رقم الطلب</TableHead>
              <TableHead className='text-[16px]'>المندوب</TableHead>
              <TableHead className='text-[16px]'>سعر الاشتراك</TableHead>
              <TableHead className='text-[16px]'>اسم المشترك</TableHead>
              <TableHead className='text-[16px]' >رقم المشترك</TableHead>
              <TableHead className='text-[16px]' >تاريخ</TableHead>
              <TableHead className='text-[16px]' >التوصيل</TableHead>
              <TableHead className='text-[16px]' >الوصل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length >= 1 ? filteredTasks.map((task, index) => {
              const isEditing = editingRowIndex === index;
              const date = todayDate(task.createdAt!);
              const phoneCount = filteredTasks.reduce((acc, task) => {
                const phone = task.phone;
                if (phone) {
                  acc[phone] = (acc[phone] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>);

              return (
                <TableRow key={index} onDoubleClick={() => isOnline(task.id, index)} className=" cursor-pointer font-semibold relative">
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{task.user?.name}</TableCell>
                  <TableCell className='w-fit'>
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={editedValues.price ?? task.price}
                        onChange={(e) => setEditedValues({ ...editedValues, price: parseInt(e.target.value) })}
                        className="border p-1 rounded w-[70px]"
                      />
                    ) : (
                      task.price
                    )}
                  </TableCell>

                  <TableCell>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedValues.clientName ?? task.clientName}
                        onChange={(e) => setEditedValues({ ...editedValues, clientName: e.target.value })}
                        className="border p-1 rounded w-[130px]"
                      />
                    ) : (
                      task.clientName
                    )}
                  </TableCell>

                  <TableCell className={` ${phoneCount[task.phone] > 1 ? 'text-blue-500' : ''}`}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedValues.phone ?? task.phone}
                        onChange={(e) => setEditedValues({ ...editedValues, phone: e.target.value })}
                        className={`border p-1 rounded w-[110px] `}
                      />
                    ) : (
                      task.phone
                    )}
                  </TableCell>

                  <TableCell >{date}</TableCell>
                  <TableCell>{task.deliveryCost}</TableCell>
                  <TableCell className='font-semibold w-fit hover:text-blue-300'>
                    <button onClick={() => OpenIMG(index)} className='cursor-pointer'>Open</button>
                    {openImg[index] && (
                      <div className="fixed rounded-md -inset-5 bg-black/20 flex flex-col items-center justify-center z-50">
                        <img
                          src={task.image}
                          alt="image"
                          className=" w-[500px]  h-[400px] rounded-md object-fill"
                        />
                        <div className="flex justify-between items-center mt-2 w-[500px] mx-auto">
                          <button onClick={() => OpenIMG(index)} className='cursor-pointer p-2 rounded bg-blue-400 delay-75 hover:bg-blue-600 text-white'>Cancel</button>
                          <div className="flex flex-col gap-y-1 text-right">
                            <p className='font-semibold  text-black'>سعر الاشتراك : <span className='text-blue-600'>{task.price}</span></p>
                            <p className='font-semibold  text-black'>اسم المشترك : <span className='text-blue-600'>{task.clientName}</span></p>
                            <p className='font-semibold  text-black'>رقم المشترك : <span className='text-blue-600'>{task.phone}</span></p>
                          </div>
                        </div>
                      </div>

                    )
                    }


                  </TableCell>
                  <TableCell>{task.isOnline ? "🟢" : "🔴"}</TableCell>
                  <TableCell onClick={() => handleCURD(index)} className='hover:text-blue-500 delay-100'><EllipsisVertical /></TableCell>
                  {isCURD[index] && (
                    <TableCell className={` z-30 w-fit  rounded-md  absolute top-0 right-12  shadow-xl border-b bg-white`} >
                      <TablesCURD handleCURD={handleCURD} handleUpdate={handleUpdate} index={index} task={task} setEditingRowIndex={setEditingRowIndex} />
                    </TableCell>)}
                  {isEditing && (
                    <TableCell className="absolute top-0 right-0 flex gap-x-2 items-center bg-white rounded-md">
                      <button onClick={() => handleUpdate(task.id, index)} className="px-2 py-1 bg-blue-400 hover:bg-blue-600 delay-100 cursor-pointer text-white rounded">Save</button>
                      <button
                        onClick={() => {
                          setEditingRowIndex(null);
                          setEditedValues({});
                        }}
                        className="px-2 py-1 bg-stone-400 hover:bg-stone-500 delay-100 cursor-pointer text-white rounded">Cancel</button>
                    </TableCell>
                  )}
                </TableRow>
              );
            }) :
              <TableRow >
                <TableCell colSpan={8} className="text-center font-semibold text-lg">لا توجد بيانات</TableCell>

              </TableRow>
            }
          </TableBody>

        </Table>
      </div>
    </>

  )
}
