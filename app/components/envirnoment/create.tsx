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
import { CREATE_ENVIRONMENT } from "@/backend/delivery"
import { DataPhones } from "../DataProvider"


export function CreateEnvironment({ box }: { box: (index: number) => void }) {
  const { showAlert } = DataPhones()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  async function createEnv() {
    const data = { name, password };
    if (!name && !password) {
      showAlert("Either Name or Password is required!", false);
      return null;
    }
    const create = await CREATE_ENVIRONMENT(data);
    showAlert(name + " created successfully ✅", true)
    setName('');
    setPassword('');
    box(0);
    return create;
  }
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create Environment</CardTitle>
        <CardDescription className="font-sans">Add a name & password</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Environment Name</Label>
              <Input min={6} id="name" onChange={(e) => setName(e.target.value)} placeholder="Environment Name" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input type="password" min={6} id="password" onChange={(e) => setPassword(e.target.value)} placeholder="Environment Password" />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button className="cursor-pointer bg-slate-400 hover:bg-slate-500 delay-100 text-white" onClick={() => box(0)}>Cancel</Button>
        <Button className="cursor-pointer bg-blue-400 hover:bg-blue-600 delay-100 text-white" onClick={createEnv}>Create</Button>
      </CardFooter>
    </Card>
  )
}