'use client';

import { CREATE_DELIVERY_TASK, uploadImageToSupabase } from '@/backend/delivery';
import React, { useRef, useState } from 'react';
import { DataPhones } from '../DataProvider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

enum Price {
  twentyAight = '28000',
  thirtyFive = '35000',
  fourtyFive = '45000',
  sixtyFive = '65000',
  hunderd = '100000'
}

export default function CreateTask() {
  const { showAlert, getTasks } = DataPhones();
  const [clientName, setClientName] = useState('');
  const [price, setPrice] = useState<Price>(Price.thirtyFive);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    let finalFile = selectedFile;

    // HEIC to JPEG conversion
    if (selectedFile.type === 'image/heic' || selectedFile.name.endsWith('.heic')) {
      try {
        const convertedBlob = await heic2any({
          blob: selectedFile,
          toType: 'image/jpeg',
          quality: 0.9,
        });

        finalFile = new File([convertedBlob as BlobPart], selectedFile.name.replace(/\.heic$/i, '.jpeg'), {
          type: 'image/jpeg',
        });
      } catch (error) {
        console.error('HEIC conversion failed:', error);
        showAlert('Failed to convert image format', false);
        return;
      }
    }

    // Compress the image
    try {
      const compressed = await imageCompression(finalFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      setFile(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      showAlert('Failed to compress image', false);
    }
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!file) {
      showAlert("Please select an image", false);
      setLoading(false);
      return;
    }
    const filePath = `public/${Date.now().toString().slice(0, 6)}-${file.name}`;
    const EnvId = localStorage.getItem("envId");
    console.log("📷 Selected file size:", file.size, "bytes");

    if (!EnvId) {
      showAlert("Environment not found", false);
      return;
    }

    try {
      const imageUrl = await uploadImageToSupabase(file, filePath);

      const data = {
        environmentId: EnvId,
        clientName,
        price: Number(price),
        phone,
        image: imageUrl,
      }
      const res = await CREATE_DELIVERY_TASK(data)
      if (res instanceof Error) {
        showAlert(res.message, false);
        return;
      } else if (typeof res === "string") {
        showAlert(res, false);
        return;
      }
      showAlert('Task created ✅', true);
      getTasks();
      setClientName('');
      setPrice(Price.thirtyFive);
      setPhone('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      showAlert('Failed to create task -- ' + err, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" lg:w-[500px] w-full mx-auto mt-8 p-6 bg-white shadow-md rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">Create Delivery Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <div className="flex flex-col space-y-1.5 bg-white">
          <Label htmlFor="price">Price</Label>
          <Select
            value={price || Price.thirtyFive}
            onValueChange={(val: Price) => setPrice(val)}
          >
            <SelectTrigger id="price" className="cursor-pointer">
              <SelectValue placeholder="Select a price" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              <SelectItem className="cursor-pointer" value={Price.twentyAight}>28,000</SelectItem>
              <SelectItem className="cursor-pointer" value={Price.thirtyFive}>35,000</SelectItem>
              <SelectItem className="cursor-pointer" value={Price.fourtyFive}>45,000</SelectItem>
              <SelectItem className="cursor-pointer" value={Price.sixtyFive}>65,000</SelectItem>
              <SelectItem className="cursor-pointer" value={Price.hunderd}>100,000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <input
          type="number"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          ref={fileInputRef}
          id='camera-upload'
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />

        <div className="flex items-center justify-between">
          <Button disabled={loading} type='submit' className="cursor-pointer bg-blue-400 hover:bg-blue-600 delay-100 text-white">{loading ? 'Adding...' : 'Add Task'}</Button>
          <Button variant="outline" className="cursor-pointer bg-slate-400 hover:bg-slate-500 delay-100 text-white" onClick={() => {
            setClientName('');
            setPrice(Price.thirtyFive);
            setPhone('');
            setFile(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
          }}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
