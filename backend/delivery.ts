"use server"
import { auth } from '@/auth'
import { db } from '@/db';
import { supabase } from '@/supabase';
import { startOfDay, endOfDay } from 'date-fns';

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

export async function CREATE_DELIVERY_TASK({ environmentId, clientName, price, phone, image, createdAt, updatedAt }: CreateDeliveryTask) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";
    
      
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.id) return "User Not Found";

    const isCollaborator = await db.collaborator.findFirst({
      where: { userId: user.id, environmentId },
      include: { deliveryProfile: true },
    });


    if (isCollaborator?.role === 'DELIVERY') {
      
      const deliveryTask = await db.dilvered.create({
        data: {
          userId: user.id,
          clientName,
          price,
          phone,
          image,
          deliveryCost: isCollaborator.deliveryProfile?.deliveryCost,
          address: isCollaborator.deliveryProfile?.address!,
          isReceived: false,
          isOnline: false,

          environmentId,
        },
      });

      console.log("Delivery task created successfully");
        return deliveryTask;
    }else return "Error -- You are not a delivery";
  } catch (err: unknown) {
    if (err instanceof Error) return "Error----" + err.message;
    else return "Unknown Error occurred";
  }
}



export async function GET_DELIVERY_TASKS(environmentId: string, day?: number, month?: number) {
  try {
    const session = await auth();
    if (!session?.user?.email) return "You need to sign in first";

    // These two can run at the same time ⏱️
    const [user, environment] = await Promise.all([
      db.user.findUnique({ where: { email: session.user.email } }),
      db.environment.findUnique({
        where: { id: environmentId },
        include: {
          collaborators: {
            where: { user: { email: session.user.email } },
            select: { role: true },
          },
        },
      }),
    ]);

    if (!user?.id) return "User Not Found";
    if (!environment) return "Environment ID Is Not Found";

    const isOwner = environment.ownerId === user.id;
    const isCollaborator = environment.collaborators[0];

    if (!isOwner && (!isCollaborator || isCollaborator.role === 'DELIVERY')) {
      return "You are not allowed to view";
    }

    // Time filtering
    const now = new Date();
    const targetDay = day ?? now.getDate();
    const targetmonth = month ?? now.getMonth();
    const targetDate = new Date(now.getFullYear(), now.getMonth(), targetDay);
    const from = startOfDay(targetDate);
    const to = endOfDay(targetDate);

    const deliveryTasks = await db.dilvered.findMany({
      where: {
        // createdAt: { gte: from, lte: to },
        environmentId,
      },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    if (deliveryTasks.length === 0) return "No delivery task found";

    return deliveryTasks;
  } catch (err: unknown) {
    if (err instanceof Error) return "Error----" + err.message;
    else return "Unknown Error occurred";
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

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.id) return "User Not Found";

    const environment = await db.environment.findUnique({
      where: { id: environmentId },
      select: { ownerId: true },
    });
    if (!environment) return "Environment ID Is Not Found";


    // Check if current user is either the owner or a collaborator with permissions
    const isCollaborator = await db.collaborator.findFirst({
      where: { environmentId, userId: user.id },
    });

    const isOwner = environment.ownerId === user.id;
    if (!isOwner && (!isCollaborator || [ 'DELIVERY'].includes(isCollaborator.role))) {
      return "You are not allowed to updqate";
    }

    if (updates.isOnline) {
      if(isCollaborator?.role === "VIEWER"){
      const updated = await db.dilvered.update({
      where: { id },
      data: updates,
    });
    return updated;
    }
  }
    if (!isOwner && (!isCollaborator || ['VIEWER', 'DELIVERY'].includes(isCollaborator.role))) {
      return "Oh sorry, You are not allowed to update";
    }
    const updated = await db.dilvered.update({
      where: { id },
      data: updates,
    });
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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
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
    const collaboratorRole = environment.collaborators[0]?.role;

    if (isOwner || collaboratorRole === "ADMIN") {
      const deletedTask = await db.dilvered.delete({
        where: { id },
      });
      return deletedTask;
    }

    return "Oh sorry, You are not allowed to delete";
  } catch (err) {
    if (err instanceof Error) return err.message;
    return "Failed to delete task";
  }
}

