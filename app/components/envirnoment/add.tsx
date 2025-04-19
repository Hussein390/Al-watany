'use client';

import * as React from "react";
import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADD_COLLABORATOR } from "@/backend/delivery";
import { DataPhones } from "../DataProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AddColla = {
  email: string;
  environmentId: string;
  role: AddColla_Role;
  address?: string;
  deliveryCost?: number;
};

enum AddColla_Role {
  DELIVERY = "DELIVERY",
  VIEWER = "VIEWER",
  ADMIN = "ADMIN",
}
enum Region {
  بلديات = "بلديات",
  اليرموك = "اليرموك",
  فلسطين = "شالرع فلسطين",
}

export function AddCollaborator({ box }: { box: (index: number) => void }) {
  const { showAlert } = DataPhones();
  const [role, setRole] = useState<AddColla_Role>(AddColla_Role.DELIVERY);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState(Region.بلديات);
  const [deliveryCost, setDeliveryCost] = useState(0);

  async function handleSubmit() {
    const EnvId = localStorage.getItem("envId");

    if (!EnvId) {
      showAlert("Environment not found", false);
      return;
    }

    if (!email || !role) {
      showAlert("Email and Role are required!", false);
      return;
    }

    let data: AddColla = {
      email,
      environmentId: EnvId,
      role,
    };

    if (role === AddColla_Role.DELIVERY) {
      if (!address || deliveryCost === null) {
        showAlert("Address and Delivery Cost are required for delivery collaborators", false);
        return;
      }

      data = {
        ...data,
        address,
        deliveryCost,
      };
    }

    const res = await ADD_COLLABORATOR(data);
    if (res instanceof Error) {
      showAlert(res.message, false);
      box(0);
      return;
    } else if (typeof res === "string") {
      showAlert(res, false);
      box(0);
      return;
    }
    showAlert(`${email} created successfully ✅`, true);
    setEmail('');
    setRole(AddColla_Role.DELIVERY);
    setAddress(Region.بلديات);
    setDeliveryCost(0);
    box(0);
  }

  return (
    <Card className="w-[350px] " style={{ direction: "rtl" }}>
      <CardHeader>
        <CardTitle className="font-sans tracking-wider">Add Collaborator</CardTitle>
        <CardDescription className="font-sans font-semibold">Add the Email & password of the collaborator</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="Email">Email</Label>
            <Input
              id="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email"
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(val: AddColla_Role) => setRole(val)}
            >
              <SelectTrigger id="role" className="cursor-pointer">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-white z-[60]">
                <SelectItem className="cursor-pointer" value={AddColla_Role.DELIVERY}>Delivery</SelectItem>
                <SelectItem className="cursor-pointer" value={AddColla_Role.VIEWER}>Viewer</SelectItem>
                <SelectItem className="cursor-pointer" value={AddColla_Role.ADMIN}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === AddColla_Role.DELIVERY && (
            <>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={address}
                  onValueChange={(val: Region) => setAddress(val)}
                >
                  <SelectTrigger id="region" className="cursor-pointer">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[60]">
                    <SelectItem className="cursor-pointer" value={Region.اليرموك}>{Region.اليرموك}</SelectItem>
                    <SelectItem className="cursor-pointer" value={Region.فلسطين}>{Region.فلسطين}</SelectItem>
                    <SelectItem className="cursor-pointer" value={Region.بلديات}>{Region.بلديات}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="Delivery-Cost">Delivery Cost</Label>
                <Select
                  value={deliveryCost.toString()}
                  onValueChange={(val: string) => setDeliveryCost(parseInt(val))}
                >
                  <SelectTrigger id="Delivery-Cost" className="cursor-pointer">
                    <SelectValue placeholder="Select a cost" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[60]">
                    <SelectItem className="cursor-pointer" value={'0'}>0</SelectItem>
                    <SelectItem className="cursor-pointer" value='1000'>1000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleSubmit} className="cursor-pointer bg-blue-400 hover:bg-blue-600 delay-100 text-white">Add</Button>
        <Button variant="outline" className="cursor-pointer bg-slate-400 hover:bg-slate-500 delay-100 text-white" onClick={() => box(0)}>Cancel</Button>
      </CardFooter>
    </Card>
  );
}
