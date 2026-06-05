import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { title, description, priority, due_date, user_id } = body;

    if (!title) {
      return Response.json(
        { error: "Title required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          description,
          priority,
          due_date,
          user_id,
          completed: false,
        },
      ])
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
