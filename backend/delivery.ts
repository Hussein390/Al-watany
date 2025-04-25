"use server"
import { auth } from '@/auth'
import { db } from '@/db';
import { supabase } from '@/supabase';
import { startOfDay, endOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// ENVIRONMENT CREATION
export async function CREATE_ENVIRONMENT({name, password}: {name: string, password: string}) {  
  try {    
    const session = await auth();
  
    if (!session?.user?.email) {
        return ("You need to sing in first" )
    }
    const user = await db.user.findUnique({where: {email: session.user.email}});
      
      if (!user || !user.id) {
        return ("User Not Found");
    }
    const if_envirnoment_existsed = await db.environment.findMany({ where: { name } });
  
      if (!name || if_envirnoment_existsed!.length >=1) {
        return ("Name already exists");
    }
    const environment = await db.environment.create({
      data: {
        name,
        password,
        ownerId: user.id
      }
    })
    console.log("environment created successfully");
    return environment
  } catch (err: unknown) {
    if (err instanceof Error) return ("Error----" + err.message)
    else return "Unknown Error occurred"
  }

}
// ENVIRONMENT DISPLAY
export async function GET_ENVIRONMENT({ name }: { name: string }) {
  try {    
    const session = await auth();
  
    if (!session?.user?.email) {
        return ("You need to sing in first" )
    }
    const [user, environment] = await Promise.all([
      db.user.findUnique({ where: { email: session.user.email } }),
      db.environment.findMany({
        where: {
          name: { contains: name.trim(), mode: 'insensitive' },
        }, include: {
          dilvered: true,
          collaborators: true,
          owner: true
        } }),
    ]);
      
      if (!user || !user.id) {
        return ("User Not Found");
    }

    return environment
  } catch (err: unknown) {
    if (err instanceof Error) return ("Error----" + err.message)
    else return "Unknown Error occurred"
  }
}
export async function GET_ENVIRONMENT_BY_ID({ id }: { id: string }) {
  try {    
    const session = await auth();
  
    if (!session?.user?.email) {
        return ("You need to sing in first" )
    }
    const [user, environment] = await Promise.all([
      db.user.findUnique({ where: { email: session.user.email } }),
      db.environment.findUnique({
        where: { id },
        include: {
          dilvered: true,
          collaborators: true,
          owner: true
        }
      }),
    ]);
      
      if (!user || !user.id) {
        return ("User Not Found");
    }
    

    console.log("environment created successfully");
    return environment
  } catch (err: unknown) {
    if (err instanceof Error) return ("Error----" + err.message)
    else return "Unknown Error occurred"
  }
}
export async function DELETE_ENVIRONMENT_BY_ID({ id, password }: { id: string, password: string }) {
  try {    
    const session = await auth();
  
    if (!session?.user?.email) {
        return ("You need to sing in first" )
    }
    const [user, environment] = await Promise.all([
      db.user.findUnique({ where: { email: session.user.email } }),
      db.environment.findUnique({
        where: { id },
        select: { ownerId: true },
      }),
    ]);
      
      if (!user || !user.id) {
        return ("User Not Found");
    }

    if (!environment) return "Environment Not Found";
    const isOwner = environment.ownerId === user.id;
    if (!isOwner) {
      return "You are not allowed to delete this environment";
    }
    await db.environment.delete({
      where: {
        id,
        password
      },
      include: {
        dilvered: true,
        collaborators: true, 
        owner: true
      }
    });

    console.log("environment deleted successfully");
    return 'environment deleted successfully'
  } catch (err: unknown) {
    if (err instanceof Error) return ("Error----" + err.message)
    else return "Unknown Error occurred"
  }
}


//ADD A COLLABORATOR
type AddColla = {
  email: string,
  environmentId: string,
  role: AddColla_Role,
  address?: string,
  deliveryCost?: number,
}
enum AddColla_Role {
  DELIVERY = 'DELIVERY',  
  VIEWER = 'VIEWER',
  ADMIN = 'ADMIN',
}
export async function ADD_COLLABORATOR({ email, environmentId, role, address, deliveryCost }: AddColla) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please, enter a valid email \"example@email.com\"✅";

    const [user, environment, invitedUser] = await Promise.all([
      db.user.findUnique({ where: { email: session.user.email } }),
      db.environment.findUnique({
      where: { id: environmentId },
      select: { ownerId: true },
      }),
      await db.user.findUnique({ where: { email } })
    ]);

    if (!user?.id) return "User Not Found";

    if (!environment) return "Environment Not Found";


     // Find the user being invited
    if (!invitedUser) return "User with this email does not exist";

    // Check if the invited user is already a collaborator in this environment
    const isCollaboratorExist = await db.collaborator.findFirst({
      where: {
        userId: invitedUser.id,
        environmentId,
      },
    });
    if (isCollaboratorExist) return "This user is already a collaborator";

    // Check if current user is either the owner or a collaborator with permissions
    const isCollaborator = await db.collaborator.findFirst({
      where: { environmentId, userId: user.id },
    });

    const isOwner = environment.ownerId === user.id;
    if (!isOwner && (!isCollaborator || ['VIEWER', 'DELIVERY'].includes(isCollaborator.role))) {
      return "You are not allowed to add";
    }

    if (role === AddColla_Role.DELIVERY) {
      await db.collaborator.create({
      data: {
        userId: invitedUser.id,
        environmentId,
          role,
          deliveryProfile: {
            create: {
              address,
              deliveryCost,
              delivered: 0,
            },
          },
      },
      });
    } else if ([AddColla_Role.ADMIN, AddColla_Role.VIEWER].includes(role)) {
      await db.collaborator.create({
        data: {
          userId: invitedUser.id,
          environmentId,
          role,
        },
      })
    } 

    return "Collaborator added successfully";
  } catch (err: unknown) {
    if (err instanceof Error) return "Error----" + err.message;
    else return "Unknown Error occurred";
  }
}
export async function GET_COLLABORATORS(environmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";
      
      const user = await db.user.findUnique({ where: { email: session.user.email } });
      if (!user?.id) return "User Not Found";
  
      const environment = await db.environment.findUnique({
      where: { id: environmentId },
      include: {
        collaborators: {
          where: { userId: user.id }, 
          select: { role: true },
        },
      },
    });

    if (!environment) return "Environment ID Is Not Found";

    const isOwner = environment.ownerId === user.id;
    const isCollaborator = environment.collaborators[0];
      if (!isOwner && !isCollaborator) {
        return "Oh sorry, You are not allowed to view";
      }
  
      const collaborators = await db.collaborator.findMany({
        where: { environmentId },
        include: { user: true, deliveryProfile: true },
      });
  
        return collaborators;
    } catch (err: unknown) {
      if (err instanceof Error) return "Error----" + err.message;
      else return "Unknown Error occurred";
    }
  }
export async function CHECK_ROLE(environmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";
      
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.id) return "User Not Found";

    const environment = await db.environment.findUnique({
      where: { id: environmentId },
      include: {
        collaborators: {
          where: { userId: user.id }, 
          select: { role: true },
        },
      },
    });

    if (!environment) return "Environment ID Is Not Found";

    const isOwner = environment.ownerId === user.id;
    const isCollaborator = environment.collaborators[0]?.role;

    if (isCollaborator === 'DELIVERY') {
      return false;
    } else if (isOwner || ['ADMIN', 'VIEWER'].includes(isCollaborator)) {
      return true;
    }

    return "ُEither sign in or create an environment";
  } catch (err: unknown) {
    if (err instanceof Error) return "Error----" + err.message;
    else return "Unknown Error occurred";
  }
}



// CREATE A DELIVERY TASK
type CreateDeliveryTask = {
  environmentId: string,
  clientName: string,
  price: number,
  phone: string,
  image: string,
  createdAt?: Date,
  updatedAt?: Date,
}
export async function uploadImageToSupabase(file: File, filePath: string) {
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Supabase upload error:', error); // 👈 log actual error
    return'Image upload failed';
  }

  const publicUrl = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath).data.publicUrl;

  return publicUrl;
}

export async function CREATE_DELIVERY_TASK({ environmentId, clientName, price, phone, image }: CreateDeliveryTask) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";
    
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single();
    if (userError || !userData?.id) return "User Not Found";
    
    const { data: collaData, error: collaError } = await supabase
      .from('Collaborator')
      .select(`
        role,
        DeliveryProfile (
          deliveryCost,
          address,
          delivered
        )
      `)
      .eq('environmentId', environmentId)
      .eq('userId', userData.id)
      .single();

    if (collaError) return "Collaborator: " + collaError.message;
    
    if (collaData?.role === 'DELIVERY') {
      
      const { data: deliveryTask, error } = await supabase
        .from('Dilvered')
        .insert([
          {
            id: uuidv4(),
            userId: userData.id,
            clientName,
            price,
            phone,
            image,
            deliveryCost: collaData?.DeliveryProfile[0]?.deliveryCost,
            address: collaData?.DeliveryProfile[0].address,
            isReceived: false,
            isOnline: false,
            environmentId,
            createdAt: new Date(),
            updatedAt: new Date(),
            
          },
        ])
        .select(`
    *,
    user:User (
            name
          )
  `)
        .order('createdAt', { ascending: true }); // optional: returns the inserted row(s)
      if (error) return "Error;;;: " + error.message;


      console.log("Delivery task created successfully");
      return deliveryTask;
    }
    
    else return "Error -- You are not a delivery. You're " + collaData?.role ;
  } catch (err: unknown) {
    if (err instanceof Error) return "Error----" + err.message;
    else return "Unknown Error occurred";
  }
}

export async function GET_DELIVERY_TASKS(environmentId: string, day?: number, month?: number) {
  try {
    const session = await auth()
    if (!session?.user?.email) return "You need to sign in first"

    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData?.id) return "User Not Found"

    // 2. Fetch environment and collaborator info
    const { data: envData, error: envError } = await supabase
      .from('Environment')
      .select(`
        _id,
        ownerId,
        Collaborator (
          role,
          user:User (
            email
          )
        )
      `)
      .eq('_id', environmentId)
      .single()

    if (envError || !envData) return  envError.message;

    const isOwner = envData.ownerId === userData.id
    const isCollaborator = envData.Collaborator.find((c: any) => c.user.email === session.user!.email)

    if (!isOwner && (!isCollaborator || isCollaborator.role === 'DELIVERY')) {
      return "You are not allowed to view"
    }

    // 3. Filter by date
    const now = new Date()
    const targetDay = day ?? now.getDate()
    const targetMonth = month ?? now.getMonth()
    const targetDate = new Date(now.getFullYear(), targetMonth, targetDay)
    const from = startOfDay(targetDate).toISOString()
    const to = endOfDay(targetDate).toISOString()

    // 4. Get delivery tasks
    const { data: tasks, error: taskError } = await supabase
      .from('Dilvered')
      .select(`
        *,
        user:User(*)
      `)
      .gte('createdAt', from)
      .lte('createdAt', to)
      .eq('environmentId', environmentId)
      .order('createdAt', { ascending: true })

    if (taskError) return "Error fetching tasks: " + taskError.message
    if (!tasks || tasks.length === 0) return "No delivery task found"

    return tasks

  } catch (err: unknown) {
    if (err instanceof Error) return "Error----" + err.message
    return "Unknown Error occurred"
  }
}


type UpdateDeliveryTask = {
  id: string;
  clientName?: string;
  price?: number;
  phone?: string;
  image?: string;
  isReceived?: boolean;
  isOnline?: boolean;
  deliveryCost?: number;
  address?: string;
};

export async function UPDATE_DELIVERY_TASK(id: string, updates: Partial<UpdateDeliveryTask>, environmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";

    const userPromise = supabase
      .from('User')
      .select('id')
      .eq('email', session.user.email)
      .single();
      
    const collaPromise = supabase
      .from('Collaborator')
      .select(`role`)
      .eq('userId', session.user.id)
      .eq('environmentId', environmentId)
      .limit(1);
    
    const EnvPromise = supabase
      .from('Environment')
      .select(`
        ownerId
      `)
      .eq('_id', environmentId)
      .single();

    // Use Promise.all to execute both promises concurrently
    const [userResult, collaResult, EnvResult] = await Promise.all([userPromise, collaPromise, EnvPromise]);

    const { data: userData, error: userError } = userResult;
    const { data: EnvData, error: EnvError } = EnvResult;
    const { data: collaData, error: collaError } = collaResult;

    if (userError || !userData?.id) return "User" + userError!.message;
    if (EnvError || !EnvData) return "Environment" + EnvError.message;
    if (collaError) return "Collaborator" + collaError.message;

    const isOwner = EnvData.ownerId === userData.id;
    if (!isOwner && (!collaData || ['VIEWER', 'DELIVERY'].includes(collaData[0].role))) {
      return "Oh sorry, You are not allowed to update";
    }
    const updated = await supabase
      .from('Dilvered')
      .update(updates)
      .eq('id', id)
      .select(`*, user:User(name)`)
      .single()
    if (updated.error) return "Error updating task: " + updated.error.message
    return updated;
  } catch (err) {
    if (err instanceof Error) return err.message; // Return the actual message
    return "Failed to update task";
  }
}


export async function DELETE_DELIVERY_TASK(id: string, environmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";

    // Get the user ID by email
    const userPromise = supabase
      .from("User")
      .select("id")
      .eq("email", session.user.email)
      .single();


    // Get the environment and check if user is the owner or admin collaborator
    const envPromise = supabase
      .from("Environment")
      .select(`
        ownerId,
        collaborators:Collaborator (
          role
        )
      `)
      .eq("_id", environmentId)
      .single();

        const [userResult,  EnvResult] = await Promise.all([userPromise,  envPromise]);

        const { data: userData, error: userError } = userResult;
        const { data: envData, error: envError } = EnvResult;
    
        if (envError || !envData) return "Environment ID Is Not Found";
        if (userError || !userData?.id) return "User Not Found";

    const isOwner = envData.ownerId === userData.id;
    const collaboratorRole = envData.collaborators?.[0]?.role;

    if (isOwner || collaboratorRole === "ADMIN") {
      // Delete the task
      const { data: deletedTask, error: deleteError } = await supabase
        .from("Dilvered")
        .delete()
        .eq("id", id)
        .select()
        .single();

      if (deleteError) return "Error deleting task: " + deleteError.message;
      return deletedTask;
    }

    return "Oh sorry, You are not allowed to delete";
  } catch (err) {
    if (err instanceof Error) return err.message;
    return "Failed to delete task";
  }
}
