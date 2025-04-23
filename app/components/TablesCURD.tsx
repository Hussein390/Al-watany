'use client'
import { CreateDeliveryTask, DataPhones } from './DataProvider';
import { DELETE_DELIVERY_TASK } from '@/backend/delivery';

type TableRowProps = {
  handleCURD: (id: number) => void,
  handleUpdate: (taskId: string, index: number, values: Partial<CreateDeliveryTask>) => void,
  setEditingRowIndex: React.Dispatch<React.SetStateAction<number | null>>,
  task: CreateDeliveryTask,
  index: number,
}
export default function TablesCURD({ handleCURD, handleUpdate, index, task, setEditingRowIndex }: TableRowProps) {
  const { showAlert, setTasks } = DataPhones();


  // async function handleDelete() {
  //   try {
  //     const EnvId = localStorage.getItem("envId");

  //     if (!EnvId) {
  //       showAlert("Environment not found", false);
  //       return;
  //     }

  //     const updatedTask = await DELETE_DELIVERY_TASK(task.id, EnvId);

  //     if (updatedTask instanceof Error) {
  //       showAlert(updatedTask.message, false);
  //       return;
  //     } else if (typeof updatedTask === "string") {
  //       showAlert(updatedTask, false);
  //       return;
  //     }
  //     setTasks(prevTasks => prevTasks.filter(taskb => taskb.id !== task.id));
  //     setEditingRowIndex(null);
  //     showAlert("Task deleted successfully", true);
  //   } catch (err) {
  //     showAlert("Failed to update task", false);
  //   }
  // }
  const handleDelete = async () => {
    const EnvId = localStorage.getItem("envId");
    if (!EnvId) {
      showAlert("Environment not found", false);
      return;
    }

    // 🧠 Optimistically remove the task from the UI


    try {
      const deleted = await DELETE_DELIVERY_TASK(task.id, EnvId);

      if (deleted instanceof Error || typeof deleted === "string") {
        // 🛑 Optional rollback: re-add the task if deletion fails
        setTasks(prevTasks => [...prevTasks, task]); // only do this if needed
        showAlert(typeof deleted === "string" ? deleted : deleted.message, false);
        return;
      }
      setTasks(prevTasks => prevTasks.filter(t => t.id !== task.id));
      setEditingRowIndex(null);
      showAlert("Task deleted successfully ✅", true);
    } catch (err) {
      console.error(err);
      // 🛑 Optional rollback
      setTasks(prevTasks => [...prevTasks, task]);
      showAlert("Failed to delete task ❌", false);
    }
  };

  const array = [
    { id: 3, name: 'مسح', onClick: () => { handleDelete() } },
    { id: 2, name: 'تم استلام', onClick: () => { handleUpdate(task.id, index, { isReceived: !task.isReceived }) } },
    { id: 1, name: 'تعديل', onClick: () => { setEditingRowIndex(index) } },
  ]
  return (

    <div className={` flex items-center gap-x-3 `}>{array.map(item => {
      return (
        <div key={item.id} onClick={() => {
          handleCURD(index)
          item.onClick && item.onClick()

        }} className={`hover:bg-stone-200  text-black delay-75  p-1 rounded-md  cursor-pointer bg-dark font-sans `} >{item.name}</div>
      )
    })}
    </div>

  )
}
