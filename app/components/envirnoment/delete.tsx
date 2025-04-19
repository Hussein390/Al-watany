import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { DELETE_ENVIRONMENT_BY_ID } from "@/backend/delivery"
import { DataPhones } from "../DataProvider"


export function DeleteEnvironment({ box }: { box: (index: number) => void }) {
  const { showAlert } = DataPhones()
  const [password, setPassword] = useState('')

  async function createEnv() {
    const EnvId = localStorage.getItem("envId");
    const data = { id: EnvId!, password };
    if (!EnvId && !password) {
      showAlert("Either Name or Password is required!", false);
      return null;
    }
    const create = await DELETE_ENVIRONMENT_BY_ID(data);
    showAlert(EnvId + " deleted successfully ✅", true)
    setPassword('');
    box(0);
    return create;
  }
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Delete Environment</CardTitle>
        <CardDescription className="font-sans">This will delete the whole environment</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input type="password" min={6} id="password" onChange={(e) => setPassword(e.target.value)} placeholder="Environment Password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button className="cursor-pointer bg-slate-400 hover:bg-slate-500 delay-100 text-white" onClick={() => box(0)}>Cancel</Button>
        <Button className="cursor-pointer bg-red-400 hover:bg-red-600 delay-100 text-white" onClick={createEnv}>Delete</Button>
      </CardFooter>
    </Card>
  )
}