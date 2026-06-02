import { supabase } from "@/lib/supabase";

export const createTask = async (task: {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  due_date?: string;
  user_id: string;
}) => {
  const { data, error } = await supabase.from("tasks").insert([
    {
      title: task.title,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date,
      user_id: task.user_id,
      completed: false,
    },
  ]).select();

  if (error) {
    console.error("SUPABASE ERROR:", error);
    throw error;
  }

  return data;
};
